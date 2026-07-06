// progress feature — the single write surface (docs/AGENT-PROMPTS.md epsilon).
// P0 contract: v.* validators on args; authz helper as the FIRST handler line;
// userId comes from ctx via the helper, NEVER from args — a user can only ever
// write their own completions.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { assertCourseActableByRole, requireMemberForLesson } from "./access";
import { deriveCourseProgress, ensureCourseCompletion } from "./derive";
import { fail } from "./errors";

/**
 * Mark a lesson complete for the CURRENT user. Idempotent twice over:
 *  1. lesson: checks by_user_lesson first — a repeat call is a no-op insert;
 *  2. course: when this completion makes the count full, courseCompletion is
 *     created via ensureCourseCompletion (checks by_user_course first).
 * Draft/archived courses are NOT_FOUND for plain members (mirrors
 * courses.getLesson) so no phantom badge is earned before publish.
 */
export const markLessonComplete = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { userId, lesson, membership } = await requireMemberForLesson(ctx, args.lessonId);

    const course = await ctx.db.get(lesson.courseId);
    if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
    // TODO(rr): confirm — chose to block members from completing draft/archived
    // course lessons (NOT_FOUND), mirroring courses.getLesson, so no phantom
    // badge is earned pre-publish. The epsilon prompt specified member authz +
    // userId-from-ctx but not this guard; instructor+ may still mark for preview.
    assertCourseActableByRole(course, membership.role);

    const existing = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lesson._id))
      .unique();
    if (existing === null) {
      await ctx.db.insert("lessonCompletions", {
        tenantId: lesson.tenantId,
        userId,
        courseId: lesson.courseId,
        lessonId: lesson._id,
      });
    }

    // Recount AFTER the insert (Convex mutations read their own writes).
    const progress = await deriveCourseProgress(ctx, userId, lesson.courseId);
    if (progress.isComplete) {
      await ensureCourseCompletion(ctx, {
        tenantId: lesson.tenantId,
        userId,
        courseId: lesson.courseId,
      });
    }

    return {
      lessonId: lesson._id,
      wasAlreadyComplete: existing !== null,
      courseCompleted: progress.isComplete,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
    };
  },
});
