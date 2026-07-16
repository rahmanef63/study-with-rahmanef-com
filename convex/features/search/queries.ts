// search feature — per-tenant full-text search (#23, extended #29): published
// course titles (courses.search_title) + lesson content (lessons.search_content)
// + APPROVED resources by title (by_tenant_status index, in-memory filter).
// MEMBER-ONLY: requireTenantRole(member) is the FIRST line — anonymous and
// outsider callers are rejected before any domain row is touched (P0; pattern:
// courses/access.ts auth-before-read). Draft-guard: the lessons search index
// carries no course status (docs/DATA-MODEL.md fase-2 note), so lessons whose
// owning course is not published are dropped AFTER the bounded index read.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import {
  toCourseHit,
  toLessonHit,
  toResourceHit,
  type SearchInTenantResult,
} from "./projections";
import {
  assertSearchQuery,
  COURSE_TAKE,
  LESSON_TAKE,
  RESOURCE_SCAN_TAKE,
  RESOURCE_TAKE,
} from "./validate";

export const searchInTenant = query({
  args: { tenantId: v.id("tenants"), q: v.string() },
  handler: async (ctx, args): Promise<SearchInTenantResult> => {
    await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const q = args.q.trim();
    assertSearchQuery(q); // 2..60 chars → VALIDATION_FAILED

    // Published courses by title — status filtered structurally in the index.
    const courses = await ctx.db
      .query("courses")
      .withSearchIndex("search_title", (s) =>
        s.search("title", q).eq("tenantId", args.tenantId).eq("status", "published")
      )
      .take(COURSE_TAKE);

    // Lessons by content — tenant-scoped; draft-guard applied below.
    const lessons = await ctx.db
      .query("lessons")
      .withSearchIndex("search_content", (s) =>
        s.search("contentMd", q).eq("tenantId", args.tenantId)
      )
      .take(LESSON_TAKE);

    // DRAFT-GUARD: one course load per UNIQUE courseId (bounded ≤ LESSON_TAKE);
    // only lessons of PUBLISHED courses survive — drafts never reach members.
    const courseIds = [...new Set(lessons.map((lesson) => lesson.courseId))];
    const publishedById = new Map<Id<"courses">, Doc<"courses">>();
    for (const courseId of courseIds) {
      const course = await ctx.db.get(courseId);
      if (course !== null && course.status === "published") {
        publishedById.set(courseId, course);
      }
    }

    const lessonHits = lessons.flatMap((lesson) => {
      const course = publishedById.get(lesson.courseId);
      return course === undefined ? [] : [toLessonHit(lesson, course)];
    });

    // Resources (#29): APPROVED-only, filtered STRUCTURALLY in the index —
    // pending/rejected rows are never even read (P0). Title match is an
    // in-memory case-insensitive contains over a bounded take; NO new search
    // index (DATA-MODEL wave v1.4 — upgrade to searchIndex only if weak).
    const needle = q.toLowerCase();
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_tenant_status", (idx) =>
        idx.eq("tenantId", args.tenantId).eq("status", "approved")
      )
      .take(RESOURCE_SCAN_TAKE);
    const resourceHits = resources
      .filter((resource) => resource.title.toLowerCase().includes(needle))
      .slice(0, RESOURCE_TAKE)
      .map(toResourceHit);

    return [...courses.map(toCourseHit), ...lessonHits, ...resourceHits];
  },
});
