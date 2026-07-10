// analytics feature — instructor+ read surface (STATUS row #17, deferred from
// #3 "agregat instructor+"). READ-ONLY aggregates over shared tables; no new
// tables, no writes, nothing stored (docs/DATA-MODEL.md "Derivasi & invarian").
// P0: v.* validators + authz helper as the FIRST handler line; auth runs
// BEFORE any domain read (access.ts). Outputs are counts + course/lesson/quiz
// titles only — no user identifiers, no PII.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireInstructorForCourse, requireInstructorForTenant } from "./access";
import {
  countBadgesByCourse,
  countCompletionsPerLesson,
  listTenantMemberships,
  quizStatsForModules,
  type LessonCompletionStat,
  type ModuleQuizStat,
} from "./aggregate";
import { MAX_COURSES_PER_TENANT, MAX_LESSONS_PER_COURSE, MAX_MODULES_PER_COURSE } from "./constants";

/** getCourseAnalytics result — all counts derived on read. */
export type CourseAnalytics = {
  course: { _id: Id<"courses">; slug: string; title: string; status: Doc<"courses">["status"] };
  /** Every membership row of the tenant (owner + instructor + member). */
  memberCount: number;
  /** courseCompletions (badge) count for this course. */
  courseCompletionCount: number;
  totalLessons: number;
  lessons: LessonCompletionStat[];
  quizzes: ModuleQuizStat[];
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
 * Full per-course analytics for instructor+: per-lesson completion counts,
 * badge count, tenant member count, and quiz stats per module. Drafts are
 * visible here on purpose — only instructor+ ever reaches this query, and the
 * kelola surface manages drafts too.
 */
export const getCourseAnalytics = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args): Promise<CourseAnalytics> => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);

    const modules = (
      await ctx.db
        .query("modules")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .take(MAX_MODULES_PER_COURSE)
    ).sort((a, b) => a.order - b.order);
    const moduleById = new Map(modules.map((mod) => [mod._id, mod]));

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_LESSONS_PER_COURSE);
    const completionsPerLesson = await countCompletionsPerLesson(ctx, course._id);
    const memberships = await listTenantMemberships(ctx, course.tenantId);
    const badgeCounts = await countBadgesByCourse(ctx, memberships, [course._id]);
    const quizzes = await quizStatsForModules(ctx, modules);

    const lessonStats: LessonCompletionStat[] = lessons
      .map((lesson) => {
        const mod = moduleById.get(lesson.moduleId);
        return {
          lessonId: lesson._id,
          title: lesson.title,
          order: lesson.order,
          moduleId: lesson.moduleId,
          moduleTitle: mod?.title ?? "",
          moduleOrder: mod?.order ?? 0,
          completedCount: completionsPerLesson.get(lesson._id) ?? 0,
        };
      })
      .sort((a, b) => a.moduleOrder - b.moduleOrder || a.order - b.order);

    return {
      course: { _id: course._id, slug: course.slug, title: course.title, status: course.status },
      memberCount: memberships.length,
      courseCompletionCount: badgeCounts.get(course._id) ?? 0,
      totalLessons: lessons.length,
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
