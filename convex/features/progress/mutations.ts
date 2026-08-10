// progress feature — the single write surface (docs/AGENT-PROMPTS.md epsilon).
// P0 contract: v.* validators on args; authz helper as the FIRST handler line;
// userId comes from ctx via the helper, NEVER from args — a user can only ever
// write their own completions.
import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { assertLessonVisibleByRole, requireMemberForLesson } from "./access";
import { deriveCourseProgress, ensureCourseCompletion, listLessonPlacements } from "./derive";

/** Per-course numbers for one course this materi is taught in. */
type CourseOutcome = {
  courseId: Id<"courses">;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
};

/**
 * Mark a MATERI complete for the CURRENT user. Idempotent twice over:
 *  1. materi: checks by_user_lesson first — a repeat call is a no-op insert;
 *  2. course: when this completion fills a course's roster, courseCompletion is
 *     created via ensureCourseCompletion (checks by_user_course first).
 *
 * Completion identity is (userId, lessonId) — NEVER (userId, courseId,
 * lessonId). Keeping courseId in the key would ask someone who finished "sub
 * agents" in Claude Code to finish it again in Hermes, and would double-count
 * their progress. Because one materi can sit in several courses, ONE call can
 * therefore settle progress in several courses at once — every course the
 * materi is placed in is re-derived here, and each gets its own badge check.
 *
 * The materi's own `status` is the visibility gate (access.ts); the owning
 * course's draft status is not. The BADGE is still course-level, so it is only
 * minted for a PUBLISHED course — no phantom badge before publish.
 */
export const markLessonComplete = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { userId, lesson, membership } = await requireMemberForLesson(ctx, args.lessonId);
    assertLessonVisibleByRole(lesson, membership.role);

    const existing = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lesson._id))
      .first();
    const placements = await listLessonPlacements(ctx, lesson._id);

    if (existing === null) {
      await ctx.db.insert("lessonCompletions", {
        tenantId: lesson.tenantId,
        userId,
        // PROVENANCE, not identity: "where they finished it". Recorded only
        // when the materi lives in exactly one course, because with two
        // placements there is no honest answer and nothing reads this column.
        courseId: placements.length === 1 ? placements[0].courseId : undefined,
        lessonId: lesson._id,
      });
    }

    // Recount AFTER the insert (Convex mutations read their own writes).
    const courses: CourseOutcome[] = [];
    for (const placement of placements) {
      const progress = await deriveCourseProgress(ctx, userId, placement.courseId);
      courses.push({
        courseId: placement.courseId,
        completedCount: progress.completedCount,
        totalCount: progress.totalCount,
        isComplete: progress.isComplete,
      });
      if (!progress.isComplete) continue;
      const course = await ctx.db.get(placement.courseId);
      if (course === null || course.status !== "published") continue;
      await ensureCourseCompletion(ctx, {
        tenantId: course.tenantId,
        userId,
        courseId: placement.courseId,
      });
    }

    return {
      lessonId: lesson._id,
      wasAlreadyComplete: existing !== null,
      /** At least one course containing this materi is now fully complete. */
      courseCompleted: courses.some((course) => course.isComplete),
      /** One entry per course this materi is taught in (may be empty). */
      courses,
    };
  },
});
