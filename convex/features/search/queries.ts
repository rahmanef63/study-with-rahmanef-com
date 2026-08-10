// search feature — per-tenant full-text search (#23, extended #29, retargeted
// v1.8 #33): published course titles (courses.search_title) + lesson content
// (lessons.search_content) + Diskusi posts by title (posts.search_title).
// MEMBER-ONLY: requireTenantRole(member) is the FIRST line — anonymous and
// outsider callers are rejected before any domain row is touched (P0; pattern:
// courses/access.ts auth-before-read). Draft-guard: the lessons search index
// carries no course status (docs/DATA-MODEL.md fase-2 note), so lessons whose
// owning course is not published are dropped AFTER the bounded index read.
import { legacyCourseId } from "../../_shared/legacyLesson";
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import {
  toCourseHit,
  toLessonHit,
  toPostHit,
  type SearchInTenantResult,
} from "./projections";
import {
  assertSearchQuery,
  COURSE_TAKE,
  LESSON_TAKE,
  POST_SCAN_TAKE,
  POST_TAKE,
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
    const courseIds = [...new Set(lessons.map(legacyCourseId))];
    const publishedById = new Map<Id<"courses">, Doc<"courses">>();
    for (const courseId of courseIds) {
      const course = await ctx.db.get(courseId);
      if (course !== null && course.status === "published") {
        publishedById.set(courseId, course);
      }
    }

    const lessonHits = lessons.flatMap((lesson) => {
      const course = publishedById.get(legacyCourseId(lesson));
      return course === undefined ? [] : [toLessonHit(lesson, course)];
    });

    // Posts (v1.8 #33): the third source is the Diskusi feed. The curation gate
    // it replaced is gone, so there is no approved/pending/rejected filter to
    // apply — the only thing hidden is a SOFT-DELETED post, and the search index
    // carries no deletedAt column, so that guard runs AFTER the bounded read
    // (same shape as the lesson draft-guard above). tenantId is filtered
    // STRUCTURALLY in the index, so another community's posts are never read.
    const posts = await ctx.db
      .query("posts")
      .withSearchIndex("search_title", (s) =>
        s.search("title", q).eq("tenantId", args.tenantId)
      )
      .take(POST_SCAN_TAKE);
    const postHits = posts
      .filter((post) => post.deletedAt === undefined)
      .slice(0, POST_TAKE)
      .map(toPostHit);

    return [...courses.map(toCourseHit), ...lessonHits, ...postHits];
  },
});
