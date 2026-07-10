// comments feature — light anti-spam guard (assignment #16: "simple guard —
// reject when the user already holds the per-lesson cap"). NOT the rr
// rate-limit dependency; same deliberate simplicity as resources/antiSpam.ts.
//
// Counted via the by_lesson index with a bounded .take() then filter by
// userId — never a bare .collect(). Soft-DELETED comments still count toward
// the cap: deleting-and-reposting must not reset the guard.
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { fail } from "./errors";

// TODO(rr): confirm — cap enforced as `count >= 20` (max 20 comments/user/
// lesson, matching the resources assertUnderLimit precedent) over the prompt's
// literal "reject if >20" (which would allow a 21st).
export const MAX_COMMENTS_PER_USER_PER_LESSON = 20;

// Bounds the index scan; the per-user cap ≪ this, so a normal thread is
// counted exactly. // TODO(rr): bounded table — light anti-spam guard, #16.
export const ANTISPAM_SCAN_TAKE = 500;

/** Count a user's comments on a lesson (by_lesson, bounded; incl. deleted). */
export async function countUserCommentsOnLesson(
  ctx: MutationCtx,
  lessonId: Id<"lessons">,
  userId: Id<"users">
): Promise<number> {
  const rows = await ctx.db
    .query("comments")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .take(ANTISPAM_SCAN_TAKE);
  return rows.reduce((n, c) => (c.userId === userId ? n + 1 : n), 0);
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
