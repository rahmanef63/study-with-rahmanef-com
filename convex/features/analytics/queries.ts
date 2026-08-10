// analytics feature — instructor+ read surface (STATUS row #17, deferred from
// #3 "agregat instructor+"). READ-ONLY aggregates over shared tables; no new
// tables, no writes, nothing stored (docs/DATA-MODEL.md "Derivasi & invarian").
// P0: v.* validators + authz helper as the FIRST handler line; auth runs
// BEFORE any domain read (access.ts). Outputs are counts + course/materi/quiz
// titles only — no user identifiers, no PII.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireInstructorForCourse, requireInstructorForTenant } from "./access";
import {
  countBadgesByCourse,
  countCompletionsPerLesson,
  listTenantMemberships,
  quizStatsForCourse,
  type CourseQuizStat,
  type LessonCompletionStat,
} from "./aggregate";
import { MAX_COURSES_PER_TENANT, MAX_LESSONS_PER_COURSE } from "./constants";

/** getCourseAnalytics result — all counts derived on read. */
export type CourseAnalytics = {
  course: { _id: Id<"courses">; slug: string; title: string; status: Doc<"courses">["status"] };
  /** Every membership row of the tenant (owner + instructor + member). */
  memberCount: number;
  /** courseCompletions (badge) count for this course. */
  courseCompletionCount: number;
  totalLessons: number;
  /** FLAT, in teaching order (courseLessons.order) — no module grouping. */
  lessons: LessonCompletionStat[];
  quizzes: CourseQuizStat[];
};

/** listCourseSummaries item — ringkas untuk daftar kelola. */
export type CourseSummary = {
  courseId: Id<"courses">;
  slug: string;
  title: string;
  status: Doc<"courses">["status"];
  completionCount: number;
  memberCount: number;
};

/**
 * Full per-course analytics for instructor+: per-materi completion counts,
 * badge count, tenant member count, and the course's quiz stats. Drafts are
 * visible here on purpose — only instructor+ ever reaches this query, and the
 * kelola surface manages drafts too.
 *
 * The roster is `courseLessons`, read through by_course = [courseId, order], so
 * the list comes back already in teaching order and a materi shared with
 * another course is counted here exactly once (DECISIONS #36/#37). A placement
 * whose materi row is gone is skipped rather than rendered as a blank bar.
 */
export const getCourseAnalytics = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args): Promise<CourseAnalytics> => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);

    const placements = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_LESSONS_PER_COURSE);
    const lessons = await Promise.all(placements.map((p) => ctx.db.get(p.lessonId)));

    const memberships = await listTenantMemberships(ctx, course.tenantId);
    const completionsPerLesson = await countCompletionsPerLesson(
      ctx,
      memberships,
      placements.map((placement) => placement.lessonId)
    );
    const badgeCounts = await countBadgesByCourse(ctx, memberships, [course._id]);
    const quizzes = await quizStatsForCourse(ctx, course._id);

    const lessonStats: LessonCompletionStat[] = placements.flatMap((placement, index) => {
      const lesson = lessons[index];
      if (lesson === null) return [];
      return [
        {
          lessonId: lesson._id,
          title: lesson.title,
          order: placement.order,
          completedCount: completionsPerLesson.get(lesson._id) ?? 0,
        },
      ];
    });

    return {
      course: { _id: course._id, slug: course.slug, title: course.title, status: course.status },
      memberCount: memberships.length,
      courseCompletionCount: badgeCounts.get(course._id) ?? 0,
      totalLessons: lessonStats.length,
      lessons: lessonStats,
      quizzes,
    };
  },
});

/**
 * Compact per-course numbers for the kelola course list: badge completions +
 * tenant member count. Memberships are scanned ONCE and badge counts are
 * bucketed per course from each member's by_user index (see aggregate.ts).
 */
export const listCourseSummaries = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<CourseSummary[]> => {
    await requireInstructorForTenant(ctx, args.tenantId); // authz FIRST

    const courses = await ctx.db
      .query("courses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .take(MAX_COURSES_PER_TENANT);
    const memberships = await listTenantMemberships(ctx, args.tenantId);
    const badgeCounts = await countBadgesByCourse(
      ctx,
      memberships,
      courses.map((course) => course._id)
    );

    return courses.map((course) => ({
      courseId: course._id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      completionCount: badgeCounts.get(course._id) ?? 0,
      memberCount: memberships.length,
    }));
  },
});
