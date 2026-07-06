// courses feature — instructor+ read surface for /t/[slug]/kelola/kelas.
// All statuses visible here (incl. drafts) — gated by requireTenantRole
// (instructor) as the FIRST line of every handler (P0).
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { getCourseOrFail, requireInstructorForLesson } from "./access";
import {
  MANAGE_LIST_TAKE,
  MAX_LESSONS_PER_COURSE,
  MAX_MODULES_PER_COURSE,
} from "./validate";

/** All courses of a tenant, any status — manage table rows. */
export const listForManage = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "instructor");
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .take(MANAGE_LIST_TAKE);
    return courses.map((course) => ({
      _id: course._id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      status: course.status,
    }));
  },
});

/**
 * Full course tree for the editor: course + modules + lesson ROWS.
 * Lesson rows are projected without contentMd (fetched per-lesson via
 * getLessonForManage) to keep the tree payload small.
 */
export const getCourseTree = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    await requireUser(ctx); // auth BEFORE read (review fix #2)
    const course = await getCourseOrFail(ctx, args.courseId);
    await requireTenantRole(ctx, course.tenantId, "instructor");

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_MODULES_PER_COURSE);
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_LESSONS_PER_COURSE);

    return {
      course: {
        _id: course._id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        status: course.status,
        tenantId: course.tenantId,
      },
      modules: [...modules]
        .sort((a, b) => a.order - b.order)
        .map((mod) => ({
          _id: mod._id,
          title: mod.title,
          order: mod.order,
          lessons: lessons
            .filter((lesson) => lesson.moduleId === mod._id)
            .sort((a, b) => a.order - b.order)
            .map((lesson) => ({
              _id: lesson._id,
              title: lesson.title,
              order: lesson.order,
              hasVideo: lesson.youtubeVideoId !== undefined,
              linkCount: lesson.links.length,
            })),
        })),
    };
  },
});

/** Full lesson (incl. contentMd) for the lesson editor — instructor+. */
export const getLessonForManage = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);
    return {
      _id: lesson._id,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      title: lesson.title,
      youtubeVideoId: lesson.youtubeVideoId,
      contentMd: lesson.contentMd,
      links: lesson.links,
      order: lesson.order,
    };
  },
});
