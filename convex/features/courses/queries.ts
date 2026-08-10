// courses feature — member/public read surface, on the MATERI model.
// A course is an ordered list of placements (`courseLessons`), not a tree; the
// materi visibility rule lives in ./access.ts and is quoted there in full.
// Every query: v.* validators; authz/visibility gate before any data leaves.
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6): listPublished, getOverview —
// published/active rows only, safe projection, no auth by design. getOverview
// reaches each materi by id through its placement index; the by-id `get` then
// RE-CHECKS the materi status the index range would have enforced, BEFORE
// projecting (P0 permalink carve-out).
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireActiveTenantById, requireTenantRole, requireUser } from "../../_shared/auth";
import { canSeeMateri, getViewerRole, isInstructorPlus, listPlacements } from "./access";
import { fail } from "./errors";
import { LIST_TAKE } from "./validate";

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
    // tenantId arrives from the client — a suspended/pending community must not
    // keep serving its catalog to anyone who kept the id.
    await requireActiveTenantById(ctx, args.tenantId);
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
 * Course overview + FLAT ordered materi list for /k/[slug]/kelas/[courseSlug].
 * Public for PUBLISHED courses (title/silabus etalase). Draft/archived:
 * instructor+ only — everyone else gets NOT_FOUND (no existence leak).
 * Materi rows are PROJECTED (title/slug/order/hasVideo) — contentMd,
 * youtubeVideoId and links never leave via this query; draft materi are
 * filtered out for everyone below instructor.
 */
export const getOverview = query({
  args: { tenantId: v.id("tenants"), courseSlug: v.string() },
  handler: async (ctx, args) => {
    await requireActiveTenantById(ctx, args.tenantId); // suspended/pending → NOT_FOUND
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

    const placements = await listPlacements(ctx, course._id); // already ordered
    const lessons = [];
    for (const placement of placements) {
      const lesson = await ctx.db.get(placement.lessonId);
      // A placement can outlive nothing — deleteLesson removes its placements —
      // but a null read must never break the etalase of an entire course.
      if (lesson === null) continue;
      if (!canSeeMateri(lesson, viewerRole)) continue; // draft materi hidden
      lessons.push({
        _id: lesson._id,
        title: lesson.title,
        slug: lesson.slug ?? null, // null = pre-migration row, use the id route
        order: placement.order,
        hasVideo: lesson.youtubeVideoId !== undefined,
      });
    }

    return {
      course: {
        ...toCourseCard(course),
        status: course.status,
        tenantId: course.tenantId,
      },
      lessons,
      lessonCount: lessons.length,
      viewerRole,
    };
  },
});

/**
 * Full materi content — MEMBER-ONLY (R3: konten butuh join).
 * Authorization is on the MATERI'S OWN TENANT and the MATERI'S status, never
 * on a course: requireUser BEFORE the read (no existence oracle), then
 * requireTenantRole(member), then the visibility rule from ./access.ts.
 *
 * `courseId` is READING CONTEXT only, for the in-course route
 * /k/<tenant>/kelas/<courseSlug>/<lessonId>: it selects which course's
 * prev/next path to walk. Omit it and the first placement is used; a materi
 * with no placement simply reads with a null course context. A course the
 * viewer may not see (draft, viewer below instructor) yields NO context rather
 * than hiding the materi — the course page is gated, the materi is not.
 */
export const getLesson = query({
  args: { lessonId: v.id("lessons"), courseId: v.optional(v.id("courses")) },
  handler: async (ctx, args) => {
    await requireUser(ctx); // auth BEFORE read (review fix #2)
    const lesson = await ctx.db.get(args.lessonId);
    if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
    const { membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
    const role = membership.role;
    if (!canSeeMateri(lesson, role)) {
      fail("NOT_FOUND", "Materi tidak ditemukan"); // draft invisible to members
    }

    const wantedCourseId = args.courseId;
    const placement =
      wantedCourseId !== undefined
        ? await ctx.db
            .query("courseLessons")
            .withIndex("by_course_lesson", (q) =>
              q.eq("courseId", wantedCourseId).eq("lessonId", lesson._id)
            )
            .unique()
        : await ctx.db
            .query("courseLessons")
            .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
            .first();

    const course = placement === null ? null : await ctx.db.get(placement.courseId);
    const courseVisible =
      course !== null &&
      course.tenantId === lesson.tenantId &&
      (course.status === "published" || isInstructorPlus(role));

    // Prev/next walk the placements of THIS course, skipping materi the viewer
    // may not open — a member must never be handed a link into a draft.
    let prevLessonId: Id<"lessons"> | null = null;
    let nextLessonId: Id<"lessons"> | null = null;
    if (courseVisible && course !== null) {
      const siblings = await listPlacements(ctx, course._id);
      const visible: Array<Id<"lessons">> = [];
      for (const sibling of siblings) {
        const doc = await ctx.db.get(sibling.lessonId);
        if (doc !== null && canSeeMateri(doc, role)) visible.push(doc._id);
      }
      const index = visible.indexOf(lesson._id);
      if (index > 0) prevLessonId = visible[index - 1];
      if (index >= 0 && index < visible.length - 1) nextLessonId = visible[index + 1];
    }

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
      courseId: courseVisible && course !== null ? course._id : null,
      courseSlug: courseVisible && course !== null ? course.slug : null,
      courseTitle: courseVisible && course !== null ? course.title : null,
      order: courseVisible && placement !== null ? placement.order : null,
      prevLessonId,
      nextLessonId,
      viewerRole: role,
    };
  },
});
