// progress feature — member self-read surface (own progress only; the access
// table in docs/DATA-MODEL.md scopes lessonCompletions read to "user sendiri").
// P0: v.* validators + authz helper as the FIRST handler line. userId is the
// caller's, resolved by the helper from ctx — never an arg. Instructor-facing
// aggregates ("agregat: instructor+") are out of v1 scope (proposed for later).
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { assertCourseActableByRole, requireMemberForCourse, requireMemberForLesson } from "./access";
import { deriveCourseProgress } from "./derive";
import { fail } from "./errors";

/**
 * The caller's progress in one course: completed lesson ids (for syllabus
 * checks), counts, and the completion flag (for the progress bar). Counts are
 * derived from indexes on every read — percentages are never stored.
 * Draft/archived courses are NOT_FOUND for plain members (mirrors courses).
 */
export const getCourseProgress = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const { userId, course, membership } = await requireMemberForCourse(ctx, args.courseId);
    assertCourseActableByRole(course, membership.role);
    return await deriveCourseProgress(ctx, userId, args.courseId);
  },
});

/**
 * Whether the caller has completed ONE lesson — powers the lesson player's
 * "tandai selesai" / "sudah selesai" state. Bounded unique read on
 * by_user_lesson. Returns only the caller's own boolean (no data leak).
 */
export const getLessonCompletion = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { userId, lesson, membership } = await requireMemberForLesson(ctx, args.lessonId);

    const course = await ctx.db.get(lesson.courseId);
    if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
    assertCourseActableByRole(course, membership.role);

    const existing = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lesson._id))
      .unique();
    return { isCompleted: existing !== null };
  },
});
