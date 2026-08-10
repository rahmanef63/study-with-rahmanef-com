// courses feature — instructor console (/k/[slug]/kelola/kelas), on PLACEMENT.
// A course no longer OWNS its materi: it holds `courseLessons` rows pointing at
// tenant-level materi. So the console adds/removes/reorders PLACEMENTS, and
// removing a materi from a course never deletes the materi (see
// removeLessonFromCourse — deleting is lessons.deleteLesson, on purpose).
// All statuses visible here (incl. drafts) — gated by requireTenantRole
// (instructor) as the FIRST line of every handler (P0).
import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import {
  getCourseOrFail,
  getLessonOrFail,
  getPlacement,
  listPlacements,
  requireInstructorForCourse,
  requireInstructorForLesson,
} from "./access";
import { fail } from "./errors";
import { MANAGE_LIST_TAKE, MAX_LESSONS_PER_COURSE } from "./validate";

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
 * Course + its ordered placements for the editor. Materi rows are projected
 * without contentMd (fetched per-materi via getLessonForManage) to keep the
 * payload small; drafts ARE included — this surface is instructor+ only.
 */
export const getCourseForManage = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    await requireUser(ctx); // auth BEFORE read (review fix #2)
    const course = await getCourseOrFail(ctx, args.courseId);
    await requireTenantRole(ctx, course.tenantId, "instructor");

    const placements = await listPlacements(ctx, course._id); // already ordered
    const lessons = [];
    for (const placement of placements) {
      const lesson = await ctx.db.get(placement.lessonId);
      if (lesson === null) continue;
      lessons.push({
        _id: lesson._id,
        placementId: placement._id,
        title: lesson.title,
        slug: lesson.slug ?? null,
        status: lesson.status ?? "published",
        order: placement.order,
        hasVideo: lesson.youtubeVideoId !== undefined,
        linkCount: lesson.links.length,
      });
    }

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
      lessons,
      lessonCount: lessons.length,
    };
  },
});

/** Every materi of the tenant, any status — the "tambah materi" picker.
 *  Read through by_tenant_slug (prefix on tenantId), bounded. */
export const listMateriForManage = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "instructor");
    const materi = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId))
      .take(MANAGE_LIST_TAKE);
    return materi.map((lesson) => ({
      _id: lesson._id,
      title: lesson.title,
      slug: lesson.slug ?? null,
      status: lesson.status ?? "published",
      hasVideo: lesson.youtubeVideoId !== undefined,
    }));
  },
});

/** Full materi (incl. contentMd) for the materi editor — instructor+. */
export const getLessonForManage = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { lesson } = await requireInstructorForLesson(ctx, args.lessonId);
    return {
      _id: lesson._id,
      tenantId: lesson.tenantId,
      title: lesson.title,
      slug: lesson.slug ?? null,
      status: lesson.status ?? "published",
      youtubeVideoId: lesson.youtubeVideoId,
      contentMd: lesson.contentMd,
      contentBlocks: lesson.contentBlocks,
      links: lesson.links,
    };
  },
});

/** Place an existing materi at the end of a course. Cross-tenant ids read as
 *  NOT_FOUND — a placement must never bridge two communities. */
export const addLessonToCourse = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    const lesson = await getLessonOrFail(ctx, args.lessonId);
    if (lesson.tenantId !== course.tenantId) fail("NOT_FOUND", "Materi tidak ditemukan");

    if ((await getPlacement(ctx, course._id, lesson._id)) !== null) {
      fail("VALIDATION_FAILED", "Materi ini sudah ada di kelas tersebut");
    }
    const placements = await listPlacements(ctx, course._id);
    if (placements.length >= MAX_LESSONS_PER_COURSE) {
      fail("VALIDATION_FAILED", `Maksimal ${MAX_LESSONS_PER_COURSE} materi per kelas`);
    }
    const maxOrder = placements.reduce((max, row) => Math.max(max, row.order), 0);

    return ctx.db.insert("courseLessons", {
      tenantId: course.tenantId,
      courseId: course._id,
      lessonId: lesson._id,
      order: maxOrder + 1,
    });
  },
});

/**
 * Unplace a materi. Deletes the PLACEMENT ROW ONLY — the materi survives,
 * because it is tenant-level content that other courses may still teach, and
 * deleting it here would silently gut those courses. Use lessons.deleteLesson
 * to delete the materi itself.
 */
export const removeLessonFromCourse = mutation({
  args: { courseId: v.id("courses"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    const placement = await getPlacement(ctx, course._id, args.lessonId);
    if (placement === null) fail("NOT_FOUND", "Materi ini tidak ada di kelas tersebut");
    await ctx.db.delete(placement._id);
    return placement.lessonId;
  },
});

/** Reorder the whole course in one call: orderedLessonIds must be a permutation
 *  of the course's current placements (no cross-course smuggling), the new
 *  `courseLessons.order` is the 1-based array position. */
export const reorderCourseLessons = mutation({
  args: { courseId: v.id("courses"), orderedLessonIds: v.array(v.id("lessons")) },
  handler: async (ctx, args) => {
    const { course } = await requireInstructorForCourse(ctx, args.courseId);
    const placements = await listPlacements(ctx, course._id);

    const byLessonId = new Map(placements.map((row) => [row.lessonId as string, row]));
    const incoming = args.orderedLessonIds.map(String);
    if (
      incoming.length !== byLessonId.size ||
      incoming.some((id) => !byLessonId.has(id)) ||
      new Set(incoming).size !== incoming.length
    ) {
      fail("VALIDATION_FAILED", "Daftar materi tidak sesuai dengan isi kelas");
    }

    for (let i = 0; i < incoming.length; i++) {
      const placement = byLessonId.get(incoming[i]);
      if (placement !== undefined) await ctx.db.patch(placement._id, { order: i + 1 });
    }
    return course._id;
  },
});
