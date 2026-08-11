// insight feature — tenantPulse. Instructor+ read. Small and exact on purpose:
// six numbers and two short lists, not a dashboard framework. Everything here
// is either counted from an index on read or lifted from the view roll-up.
// P0: v.* validators + authz helper as the FIRST handler line.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireInstructorForTenant } from "./access";
import { MAX_LESSONS_PER_TENANT_SCAN, PULSE_TOP_N } from "./constants";
import { weekStartMs, weekWindow } from "./day";
import {
  EMPTY_TALLY,
  countActiveLearners,
  countTenantCompletions,
  listTenantMemberships,
  tallyByLesson,
} from "./rollup";

/** One named materi in the read distribution. */
export type PulseMateri = {
  lessonId: Id<"lessons">;
  title: string;
  slug: string | null;
  /** Distinct members who ever opened it. Zero is a real, common answer. */
  viewedCount: number;
  viewCount: number;
};

export type TenantPulse = {
  memberCount: number;
  /** Distinct members who opened ANY materi in the last 7 days (WIB). */
  activeThisWeek: number;
  completionsTotal: number;
  completionsThisWeek: number;
  /** Materi visible to members, i.e. the denominator of "least-read". */
  materiCount: number;
  /** Visible materi with a viewedCount of exactly zero. */
  neverReadCount: number;
  mostRead: PulseMateri[];
  leastRead: PulseMateri[];
};

/** Visibility gate for the pulse lists — mirrors access.assertLessonVisibleByRole
 *  (a missing `status` reads as published; those rows predate the column). */
const isVisible = (lesson: Doc<"lessons">): boolean =>
  (lesson.status ?? "published") === "published";

/**
 * One community's pulse: who is here, who showed up this week, what got
 * finished, and which materi sit at each end of the read distribution.
 *
 * `leastRead` deliberately includes materi with ZERO views. Those rows have no
 * roll-up at all, so a query built only on `materiViewCounts` would list the
 * *second*-least-read materi and quietly hide the ones nobody has ever opened —
 * which are the only ones worth acting on. The tenant's materi list is folded
 * back in here precisely to surface that absence.
 *
 * Ordering is total and deterministic (count, then title) so two instructors
 * looking at the same community see the same list.
 */
export const tenantPulse = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<TenantPulse> => {
    await requireInstructorForTenant(ctx, args.tenantId); // authz FIRST

    const now = Date.now();
    const week = weekWindow(now);

    const memberships = await listTenantMemberships(ctx, args.tenantId);
    const activeThisWeek = await countActiveLearners(ctx, args.tenantId, week.from, week.to);
    const completions = await countTenantCompletions(
      ctx,
      memberships,
      args.tenantId,
      weekStartMs(now)
    );

    // eq(tenantId) is a PREFIX of by_tenant_slug, so this is every materi of the
    // tenant in one indexed, bounded read — including rows with no slug and
    // rows with no status, which by_tenant_status would miss.
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
      .take(MAX_LESSONS_PER_TENANT_SCAN);
    const tallies = await tallyByLesson(ctx, args.tenantId);

    const ranked: PulseMateri[] = lessons.filter(isVisible).map((lesson) => {
      const tally = tallies.get(lesson._id) ?? EMPTY_TALLY;
      return {
        lessonId: lesson._id,
        title: lesson.title,
        slug: lesson.slug ?? null,
        viewedCount: tally.viewers,
        viewCount: tally.views,
      };
    });

    const byTitle = (a: PulseMateri, b: PulseMateri) => a.title.localeCompare(b.title);
    const mostRead = [...ranked]
      .sort((a, b) => b.viewedCount - a.viewedCount || byTitle(a, b))
      .slice(0, PULSE_TOP_N);
    const leastRead = [...ranked]
      .sort((a, b) => a.viewedCount - b.viewedCount || byTitle(a, b))
      .slice(0, PULSE_TOP_N);

    return {
      memberCount: memberships.length,
      activeThisWeek,
      completionsTotal: completions.total,
      completionsThisWeek: completions.recent,
      materiCount: ranked.length,
      neverReadCount: ranked.filter((materi) => materi.viewedCount === 0).length,
      mostRead,
      leastRead,
    };
  },
});
