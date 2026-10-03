import type { MutationCtx } from "../../_generated/server";
// progress feature — the single write surface (docs/AGENT-PROMPTS.md epsilon).
// P0 contract: v.* validators on args; authz helper as the FIRST handler line;
// userId comes from ctx via the helper, NEVER from args — a user can only ever
// write their own completions.
import { v } from "convex/values";
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { assertLessonVisibleByRole, requireMemberForLesson } from "./access";
import { deriveCourseProgress, ensureCourseCompletion, listLessonPlacements, type LegacyEligibility } from "./derive";

const settleCourseRef = makeFunctionReference<"mutation", {
  userId: Id<"users">; lessonId: Id<"lessons">; courseId: Id<"courses">;
}, boolean>("features/progress/settleCourse:settle");
/** Three full 200-lesson courses stay comfortably under 4,096 index ranges. */
const IMMEDIATE_COURSES = 3;

/** Per-course numbers for one course this materi is taught in. */
type CourseOutcome = {
  courseId: Id<"courses">;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  truncated?: boolean;
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
export const markLessonCompleteHandler = async (ctx: MutationCtx, args: {lessonId: Id<"lessons">}) => {
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
    const legacyEligibility: LegacyEligibility = new Map([[lesson._id, {
      tenantId: lesson.tenantId, published: (lesson.status ?? "published") === "published",
    }]]);
    const courseIds = [...new Set(placements
      .filter((placement) => placement.tenantId === lesson.tenantId)
      .map((placement) => placement.courseId))];
    for (const courseId of courseIds.slice(0, IMMEDIATE_COURSES)) {
      const course = await ctx.db.get(courseId);
      if (course === null || course.tenantId !== lesson.tenantId) continue;
      const progress = await deriveCourseProgress(ctx, userId, courseId, undefined, legacyEligibility);
      courses.push({
        courseId,
        completedCount: progress.completedCount,
        totalCount: progress.totalCount,
        isComplete: progress.isComplete,
        ...(progress.truncated ? { truncated: true } : {}),
      });
      if (!progress.isComplete) continue;
      if (course.status !== "published") continue;
      await ensureCourseCompletion(ctx, {
        tenantId: course.tenantId,
        userId,
        courseId,
      });
    }

    // A finite fanout, not a retry loop. Every job rechecks current access,
    // placement and completion; old metadata must be backfilled separately.
    const pending = courseIds.slice(IMMEDIATE_COURSES);
    let pendingCourses = 0;
    for (const courseId of pending) {
      const badge = await ctx.db.query("courseCompletions")
        .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("courseId", courseId)).first();
      if (badge === null) {
        await ctx.scheduler.runAfter(0, settleCourseRef, { userId, lessonId: lesson._id, courseId });
        pendingCourses += 1;
      }
    }

    return {
      lessonId: lesson._id,
      wasAlreadyComplete: existing !== null,
      /** At least one course containing this materi is now fully complete. */
      courseCompleted: courses.some((course) => course.isComplete),
      /** Immediate courses; the remaining courses settle in bounded jobs. */
      courses,
      ...(pendingCourses > 0 ? { pendingCourses } : {}),
    };
  };

export const markLessonComplete = mutation({
  args: { lessonId: v.id("lessons") },
  handler: markLessonCompleteHandler,
});
