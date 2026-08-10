// search feature — per-tenant full-text search (#23, extended #29, retargeted
// v1.8 #33, materi model #36/#37): published course titles
// (courses.search_title) + materi content (lessons.search_content) + Diskusi
// posts by title (posts.search_title).
// MEMBER-ONLY: requireTenantRole(member) is the FIRST line — anonymous and
// outsider callers are rejected before any domain row is touched (P0; pattern:
// courses/access.ts auth-before-read).
//
// MATERI DRAFT-GUARD. It used to be "the lesson's owning course is published";
// a materi belongs to the TENANT now, so the guard is the materi's OWN status:
// published (or absent — legacy rows predate the column) for a member,
// drafts additionally for instructor+. The search index carries no status
// column, so the filter runs AFTER the bounded index read. A materi with no
// slug yet is also dropped: there is no canonical URL to send the click to.
import { v } from "convex/values";
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
    const { membership } = await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const q = args.q.trim();
    assertSearchQuery(q); // 2..60 chars → VALIDATION_FAILED

    // Published courses by title — status filtered structurally in the index.
    const courses = await ctx.db
      .query("courses")
      .withSearchIndex("search_title", (s) =>
        s.search("title", q).eq("tenantId", args.tenantId).eq("status", "published")
      )
      .take(COURSE_TAKE);

    // Materi by content — tenant-scoped; materi draft-guard applied below.
    const lessons = await ctx.db
      .query("lessons")
      .withSearchIndex("search_content", (s) =>
        s.search("contentMd", q).eq("tenantId", args.tenantId)
      )
      .take(LESSON_TAKE);

    const seesDrafts = membership.role !== "member";
    const lessonHits = lessons.flatMap((lesson) => {
      const isPublished = (lesson.status ?? "published") === "published";
      if (!isPublished && !seesDrafts) return [];
      if (lesson.slug === undefined) return []; // no canonical URL → no hit
      return [toLessonHit(lesson, lesson.slug)];
    });

    // Posts (v1.8 #33): the third source is the Diskusi feed. The curation gate
    // it replaced is gone, so there is no approved/pending/rejected filter to
    // apply — the only thing hidden is a SOFT-DELETED post, and the search index
    // carries no deletedAt column, so that guard runs AFTER the bounded read
    // (same shape as the materi draft-guard above). tenantId is filtered
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
