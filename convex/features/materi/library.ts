// materi feature — the library: /k/<tenant>/materi (browse + tag filter).
// MEMBER+ throughout; there is no anonymous library, because a list of every
// materi in a community is exactly the content that membership buys.
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { query, type QueryCtx } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { canSeeMateri, isInstructorPlus } from "./access";
import { loadPlacements, loadTags } from "./links";
import type { MateriCard, MateriPage, TagCount } from "./projections";
import {
  clampPageSize,
  MAX_TAGS_RETURNED,
  normalizeTagFilter,
  TAG_SCAN_TAKE,
} from "./validate";

/** Row projection. Two bounded index reads per card — hence the small page cap. */
async function toCard(ctx: QueryCtx, lesson: Doc<"lessons">): Promise<MateriCard> {
  const placements = await loadPlacements(ctx, lesson._id);
  return {
    _id: lesson._id,
    slug: lesson.slug ?? null,
    title: lesson.title,
    tags: await loadTags(ctx, lesson._id),
    // Raw placement count: resolving each course to check its status would cost
    // one read per placement per row. The number never names a course.
    courseCount: placements.length,
    updatedAt: lesson._creationTime,
  };
}

/**
 * MEMBER+. Paginated materi library, newest first, optionally narrowed to one
 * tag. Instructor+ additionally sees drafts.
 *
 * ORDERING, precisely: the un-tagged branch walks `lessons.by_tenant_status`
 * descending. That index is [tenantId, status, _creationTime], so a page is
 * newest-first WITHIN a status band — published rows first, then (instructor+
 * only) drafts, then the handful of pre-migration rows whose status column is
 * absent. Strict global recency needs a `lessons.by_tenant` index.
 * TODO(rr): propose `lessons.index("by_tenant", ["tenantId"])` to the integrator
 * (convex/_tables/** is schema, integrator-only per AGENTS.md §4).
 *
 * The tagged branch paginates `lessonTags.by_tenant_tag` instead, newest tag row
 * first, and drops materi the viewer may not see — so a page can come back
 * shorter than `numItems` while `isDone` is still false. That is normal Convex
 * post-filter pagination; the caller keeps paging until `isDone`.
 */
export const listLibrary = query({
  args: {
    tenantId: v.id("tenants"),
    tag: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<MateriPage> => {
    const { membership } = await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const role = membership.role;
    const opts = {
      ...args.paginationOpts,
      numItems: clampPageSize(args.paginationOpts.numItems),
    };

    if (args.tag !== undefined) {
      const tag = normalizeTagFilter(args.tag);
      // A filter that cannot normalise matches nothing — answer an empty
      // terminal page rather than scanning for a tag that cannot exist.
      if (tag === null) return { page: [], isDone: true, continueCursor: "" };
      const rows = await ctx.db
        .query("lessonTags")
        .withIndex("by_tenant_tag", (q) => q.eq("tenantId", args.tenantId).eq("tag", tag))
        .order("desc")
        .paginate(opts);
      const cards: MateriCard[] = [];
      const seen = new Set<string>();
      for (const row of rows.page) {
        if (seen.has(row.lessonId)) continue;
        seen.add(row.lessonId);
        const lesson = await ctx.db.get(row.lessonId);
        if (lesson === null) continue;
        if (lesson.tenantId !== args.tenantId) continue;
        if (!canSeeMateri(lesson, role)) continue;
        cards.push(await toCard(ctx, lesson));
      }
      return { page: cards, isDone: rows.isDone, continueCursor: rows.continueCursor };
    }

    const base = ctx.db
      .query("lessons")
      .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId))
      .order("desc");
    // Drafts are excluded IN THE QUERY for everyone below instructor — an
    // absent status is a pre-migration row and counts as published.
    const scoped = isInstructorPlus(role)
      ? base
      : base.filter((f) =>
          f.or(
            f.eq(f.field("status"), "published"),
            f.eq(f.field("status"), undefined)
          )
        );
    const result = await scoped.paginate(opts);
    const page: MateriCard[] = [];
    for (const lesson of result.page) page.push(await toCard(ctx, lesson));
    return { page, isDone: result.isDone, continueCursor: result.continueCursor };
  },
});

/**
 * MEMBER+. The tenant's tag cloud with counts, from `lessonTags.by_tenant_tag`
 * (tenant-scoped index range, bounded scan, grouped in memory). Sorted by count
 * desc then alphabetically, and capped.
 *
 * A count is a row count: a draft materi contributes to the count of its tag
 * even for a plain member. Filtering it out would cost one lesson read per tag
 * row, and a number reveals nothing — the materi itself stays invisible in
 * `listLibrary` and `getBySlug`.
 */
export const listTags = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<TagCount[]> => {
    await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const rows = await ctx.db
      .query("lessonTags")
      .withIndex("by_tenant_tag", (q) => q.eq("tenantId", args.tenantId))
      .take(TAG_SCAN_TAKE);

    const counts = new Map<string, Set<string>>();
    for (const row of rows) {
      const lessons = counts.get(row.tag) ?? new Set<string>();
      lessons.add(row.lessonId); // dedupe: one materi counts once per tag
      counts.set(row.tag, lessons);
    }
    return [...counts.entries()]
      .map(([tag, lessons]) => ({ tag, count: lessons.size }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, MAX_TAGS_RETURNED);
  },
});
