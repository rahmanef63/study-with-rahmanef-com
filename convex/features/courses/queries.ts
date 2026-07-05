// courses feature — member/public read surface.
// Access rules (docs/DATA-MODEL.md): course title/description/syllabus are
// PUBLIC etalase; lesson CONTENT requires membership; drafts are invisible to
// everyone below instructor IN THE QUERY ITSELF (R4 — not just the UI).
// Every query: v.* validators; authz/visibility gate before any data leaves.
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { getViewerRole, isInstructorPlus } from "./access";
import { fail } from "./errors";
import { LIST_TAKE, MAX_LESSONS_PER_COURSE, MAX_MODULES_PER_COURSE } from "./validate";

/** Projection: safe public card shape (no createdBy leak of internal shape). */
function toCourseCard(course: Doc<"courses">) {
  return {
    _id: course._id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    coverImageUrl: course.coverImageUrl,
  };
}

/**
 * Public etalase (landing #5 + tenant home): PUBLISHED courses only.
 * No auth by design (public read per access table); drafts/archived are
 * structurally excluded by the by_tenant_status index.
 */
export const listPublished = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", args.tenantId).eq("status", "published")
      )
      .take(LIST_TAKE);
    return courses.map(toCourseCard);
  },
});

/**
 * Course overview + syllabus for /t/[slug]/kelas/[kelasSlug].
 * Public for PUBLISHED courses (title/silabus etalase). Draft/archived:
 * instructor+ only — everyone else gets NOT_FOUND (no existence leak).
 * Syllabus lessons are PROJECTED (title/order/hasVideo) — contentMd,
 * youtubeVideoId and links never leave via this query.
 */
export const getOverview = query({
  args: { tenantId: v.id("tenants"), courseSlug: v.string() },
  handler: async (ctx, args) => {
    const viewerRole = await getViewerRole(ctx, args.tenantId); // visibility gate
    const course = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", args.tenantId).eq("slug", args.courseSlug)
      )
      .unique();
    if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
    if (course.status !== "published" && !isInstructorPlus(viewerRole)) {
      fail("NOT_FOUND", "Kelas tidak ditemukan"); // drafts invisible in the QUERY
    }

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_MODULES_PER_COURSE);
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .take(MAX_LESSONS_PER_COURSE);

    const sortedModules = [...modules].sort((a, b) => a.order - b.order);
    const syllabus = sortedModules.map((mod) => ({
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
        })),
    }));

    return {
      course: {
        ...toCourseCard(course),
        status: course.status,
        tenantId: course.tenantId,
      },
      modules: syllabus,
      viewerRole,
      lessonCount: lessons.length,
    };
  },
});

/**
 * Full lesson content for the player — MEMBER-ONLY (R3: konten butuh join).
 * requireTenantRole is the first line; drafts additionally require
 * instructor+ and read as NOT_FOUND for plain members.
 */
export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (lesson === null) fail("NOT_FOUND", "Lesson tidak ditemukan");
    const { membership } = await requireTenantRole(ctx, lesson.tenantId, "member");

    const course = await ctx.db.get(lesson.courseId);
    if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
    if (course.status !== "published" && membership.role === "member") {
      fail("NOT_FOUND", "Lesson tidak ditemukan"); // draft invisible to members
    }

    // Prev/next within the module for player navigation (bounded by_module).
    const siblings = await ctx.db
      .query("lessons")
      .withIndex("by_module", (q) => q.eq("moduleId", lesson.moduleId))
      .take(MAX_LESSONS_PER_COURSE);
    const ordered = [...siblings].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((l) => l._id === lesson._id);

    return {
      _id: lesson._id,
      courseId: lesson.courseId,
      moduleId: lesson.moduleId,
      tenantId: lesson.tenantId,
      title: lesson.title,
      youtubeVideoId: lesson.youtubeVideoId,
      contentMd: lesson.contentMd,
      links: lesson.links,
      order: lesson.order,
      courseSlug: course.slug,
      courseTitle: course.title,
      prevLessonId: index > 0 ? ordered[index - 1]._id : null,
      nextLessonId:
        index >= 0 && index < ordered.length - 1 ? ordered[index + 1]._id : null,
    };
  },
});
