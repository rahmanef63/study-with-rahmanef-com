// progress feature — member self-read surface (own progress only; the access
// table in docs/DATA-MODEL.md scopes lessonCompletions read to "user sendiri").
// P0: v.* validators + authz helper as the FIRST handler line. userId is the
// caller's, resolved by the helper from ctx — never an arg. Instructor-facing
// aggregates ("agregat: instructor+") live in convex/features/analytics.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import {
  assertCourseActableByRole,
  assertLessonVisibleByRole,
  requireMemberForCourse,
  requireMemberForLesson,
} from "./access";
import { deriveCourseProgress } from "./derive";

/**
 * The caller's progress in one course: completed lesson ids (for syllabus
 * checks), counts, and the completion flag (for the progress bar). Counts are
 * derived from `courseLessons` ∩ the caller's completions on every read —
 * percentages are never stored. Draft/archived courses are NOT_FOUND for plain
 * members: this is the COURSE surface, so the course-level gate applies.
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
 * Whether the caller has completed ONE materi — powers the "tandai selesai" /
 * "sudah selesai" state on both the canonical materi page and the in-course
 * reader. Bounded point read on by_user_lesson. Returns only the caller's own
 * boolean (no data leak). The gate is the MATERI's status, not any course's:
 * completion is tenant-level content state now.
 */
export const getLessonCompletion = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { userId, lesson, membership } = await requireMemberForLesson(ctx, args.lessonId);
    assertLessonVisibleByRole(lesson, membership.role);

    const existing = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", userId).eq("lessonId", lesson._id))
      .first();
    return { isCompleted: existing !== null };
  },
});
