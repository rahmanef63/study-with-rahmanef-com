// comments feature — light anti-spam guard (assignment #16: "simple guard —
// reject when the user already holds the per-lesson cap"). NOT the rr
// rate-limit dependency; same deliberate simplicity as resources/antiSpam.ts.
//
// Counted EXACTLY via the by_lesson_user compound index with a .take() bounded
// by the cap itself — never a bare .collect(). The previous by_lesson scan
// walked the 500 OLDEST rows on the lesson, so on a thread past 500 comments
// the per-user cap could never fire at all. Soft-DELETED comments still count
// toward the cap: deleting-and-reposting must not reset the guard.
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { fail } from "./errors";

// TODO(rr): confirm — cap enforced as `count >= 20` (max 20 comments/user/
// lesson, matching the resources assertUnderLimit precedent) over the prompt's
// literal "reject if >20" (which would allow a 21st).
export const MAX_COMMENTS_PER_USER_PER_LESSON = 20;

// The scan is bounded by the cap itself: we only ever need to know whether the
// caller is AT the limit, so reading cap+1 rows answers it exactly and costs a
// constant 21 documents no matter how long the thread gets.
export const ANTISPAM_SCAN_TAKE = MAX_COMMENTS_PER_USER_PER_LESSON + 1;

/** Count a user's comments on a lesson (by_lesson_user, exact up to the cap;
 *  incl. soft-deleted). Saturates at cap+1 — the caller only compares to the
 *  cap, so a larger true count is indistinguishable and irrelevant. */
export async function countUserCommentsOnLesson(
  ctx: MutationCtx,
  lessonId: Id<"lessons">,
  userId: Id<"users">
): Promise<number> {
  const rows = await ctx.db
    .query("comments")
    .withIndex("by_lesson_user", (q) => q.eq("lessonId", lessonId).eq("userId", userId))
    .take(ANTISPAM_SCAN_TAKE);
  return rows.length;
}

/** Reject the write when the caller is already at/over the per-lesson cap. */
export function assertUnderCommentLimit(currentCount: number): void {
  if (currentCount >= MAX_COMMENTS_PER_USER_PER_LESSON) {
    fail(
      "RATE_LIMITED",
      `Maksimal ${MAX_COMMENTS_PER_USER_PER_LESSON} komentar per lesson — lanjutkan diskusi panjang di Discord ya`
    );
  }
}

// ── POST branch (v1.8 #29) ────────────────────────────────────────────────
// Same shape, same reasoning, counted through by_post_user so the cap fires no
// matter how long the thread already is.

export const MAX_COMMENTS_PER_USER_PER_POST = 20;
export const POST_SCAN_TAKE = MAX_COMMENTS_PER_USER_PER_POST + 1;

/** Count a user's comments on a post (by_post_user, exact up to the cap; incl. soft-deleted). */
export async function countUserCommentsOnPost(
  ctx: MutationCtx,
  postId: Id<"posts">,
  userId: Id<"users">
): Promise<number> {
  const rows = await ctx.db
    .query("comments")
    .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
    .take(POST_SCAN_TAKE);
  return rows.length;
}

/** Reject the write when the caller is already at/over the per-post cap. */
export function assertUnderPostCommentLimit(currentCount: number): void {
  if (currentCount >= MAX_COMMENTS_PER_USER_PER_POST) {
    fail(
      "RATE_LIMITED",
      `Maksimal ${MAX_COMMENTS_PER_USER_PER_POST} balasan per post — lanjutkan diskusi panjang di Discord ya`
    );
  }
}
