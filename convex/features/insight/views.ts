// insight feature — the ONLY write surface. One mutation, member-only,
// idempotent per day.
//
// P0 contract: v.* validators on args; authz helper as the FIRST handler line;
// `userId` comes from ctx via the helper and NEVER from args — a caller can
// only ever record their own read, so there is no way to stuff another
// member's numbers.
//
// WHY THERE IS NO RATE-LIMIT TABLE. The old pageview ingest was anonymous, so
// it needed a companion counter table keyed on a hashed IP just to survive
// contact with the internet. Here, two properties remove the need entirely:
//  1. MEMBERSHIP IS THE RATE LIMIT — requireMemberForLesson rejects anyone
//     without a membership row in the materi's own tenant.
//  2. THE DAY KEY IS THE CEILING — a member can add at most one row per materi
//     per day, and the day is computed server-side (./day.ts), never passed in.
// Together those cap the write rate at (members × materi) rows per day with no
// extra state to maintain, expire, or leak.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { assertLessonVisibleByRole, requireMemberForLesson } from "./access";
import { dayKey } from "./day";

/**
 * Record that the current member opened this materi today.
 *
 * IDEMPOTENT PER DAY: the second call from the same member on the same materi
 * on the same day is a no-op that touches nothing — not the row, not the
 * roll-up, not `lastViewedAt`. Callers may therefore fire it on every mount
 * without debouncing; a refresh loop cannot move any number.
 *
 * Drafts are not counted for plain members — they cannot see them at all
 * (assertLessonVisibleByRole throws NOT_FOUND, never leaking existence). An
 * instructor previewing their own draft IS counted, which is the deliberate
 * trade described in the return-value note below.
 *
 * Returns `{ counted, day }` rather than the tally: the client has no business
 * rendering a view counter, and returning one would invite treating this
 * member-only, once-a-day number as a popularity badge.
 */
export const recordView = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args): Promise<{ counted: boolean; day: string }> => {
    const { userId, lesson, membership } = await requireMemberForLesson(ctx, args.lessonId);
    assertLessonVisibleByRole(lesson, membership.role);

    const now = Date.now();
    const day = dayKey(now);

    // Idempotency probe: exact (materi, member, day) triple.
    const today = await ctx.db
      .query("materiViews")
      .withIndex("by_lesson_user_day", (q) =>
        q.eq("lessonId", lesson._id).eq("userId", userId).eq("day", day)
      )
      .first();
    if (today !== null) return { counted: false, day };

    // Same index, [lessonId, userId] PREFIX: "has this member EVER opened it?"
    // Read BEFORE the insert — afterwards the answer is always yes. This is
    // what keeps `viewers` an exact distinct-person count instead of a scan.
    const everBefore = await ctx.db
      .query("materiViews")
      .withIndex("by_lesson_user_day", (q) => q.eq("lessonId", lesson._id).eq("userId", userId))
      .first();

    await ctx.db.insert("materiViews", {
      tenantId: lesson.tenantId,
      lessonId: lesson._id,
      userId,
      day,
    });

    // Roll-up patched in the SAME transaction — it can never drift from the
    // rows it summarises, because Convex mutations are atomic.
    const rollup = await ctx.db
      .query("materiViewCounts")
      .withIndex("by_tenant_lesson", (q) =>
        q.eq("tenantId", lesson.tenantId).eq("lessonId", lesson._id)
      )
      .unique();
    if (rollup === null) {
      await ctx.db.insert("materiViewCounts", {
        tenantId: lesson.tenantId,
        lessonId: lesson._id,
        views: 1,
        viewers: 1,
        lastViewedAt: now,
      });
    } else {
      await ctx.db.patch(rollup._id, {
        views: rollup.views + 1,
        viewers: rollup.viewers + (everBefore === null ? 1 : 0),
        lastViewedAt: now,
      });
    }

    return { counted: true, day };
  },
});
