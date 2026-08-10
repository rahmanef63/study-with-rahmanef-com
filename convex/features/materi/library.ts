// materi feature — the library. Two surfaces, ONE query, because a skill IS a
// materi (`lessons.kind`): /k/<tenant>/materi browses `kind: "materi"` and the
// skills library browses `kind: "skill"`. MEMBER+ throughout; there is no
// anonymous library, because a list of every materi in a community is exactly
// the content that membership buys.
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { canSeeMateri, isInstructorPlus, materiKind } from "./access";
import { toCard } from "./links";
import type { MateriCard, MateriPage, MateriSort, TagCount } from "./projections";
import {
  clampPageSize,
  MAX_TAGS_RETURNED,
  normalizeTagFilter,
  TAG_SCAN_TAKE,
} from "./validate";

export const kindValidator = v.union(v.literal("materi"), v.literal("skill"));
export const sortValidator = v.union(
  v.literal("newest"),
  v.literal("oldest"),
  v.literal("title")
);

/** A→Z. In-page by necessity — see the ORDERING note on listLibrary. */
export function sortCards(cards: MateriCard[], sort: MateriSort): MateriCard[] {
  return sort === "title"
    ? [...cards].sort((a, b) => a.title.localeCompare(b.title, "id"))
    : cards;
}

/**
 * MEMBER+. Paginated library for one `kind`, optionally narrowed to one tag and
 * ordered three ways. Instructor+ additionally sees drafts.
 *
 * KIND. Absent means "materi" — the same default the column carries, so the
 * pre-existing library surface behaves exactly as it did before skills existed.
 *   · "skill" reads ONE exact index range, `by_tenant_kind_status` pinned to
 *     eq(tenantId).eq(kind, "skill"). Every skill writes the column explicitly,
 *     so there is no undefined case inside that range to chase.
 *   · "materi" keeps the existing `by_tenant_status` range and drops skills
 *     with a `.neq` as it scans. Filtering an already-bounded scan is cheaper
 *     than ranging the kind index twice (once for "materi", once for the
 *     undefined band that holds all 76 legacy rows) and it keeps pages full.
 *
 * ORDERING, and WHERE each part of it is applied:
 *   · newest / oldest ride the INDEX (`.order("desc" | "asc")`). Index order is
 *     free, and it is what makes pagination coherent — the cursor walks the
 *     same order the reader sees.
 *   · A→Z is applied IN-PAGE, after the bounded read. `lessons` has no title
 *     index, so a globally alphabetised library would mean reading every row of
 *     the tenant in order to sort it — unbounded, which §6 forbids. The page is
 *     ≤20 rows, so A→Z orders what the reader is actually looking at and page 2
 *     restarts the alphabet. Stated to the frontend rather than faked.
 *   · Either index is [tenantId, …, status, _creationTime], so "newest" is
 *     newest WITHIN a status band: published rows, then (instructor+ only)
 *     drafts, then the pre-migration rows with no status column. Strict global
 *     recency needs a `lessons.by_tenant` index.
 *     TODO(rr): propose `lessons.index("by_tenant", ["tenantId"])` to the
 *     integrator (convex/_tables/** is schema, integrator-only per AGENTS.md §4).
 *
 * The tagged branch paginates `lessonTags.by_tenant_tag` instead and drops rows
 * of the wrong kind or the wrong visibility afterwards — so a page can come back
 * shorter than `numItems` while `isDone` is still false. That is normal Convex
 * post-filter pagination; the caller keeps paging until `isDone`. Its time sort
 * rides the TAG ROW's creation time, which is when the materi was tagged; the
 * alternative is reading every tag row in the tenant to sort by lesson time.
 */
export const listLibrary = query({
  args: {
    tenantId: v.id("tenants"),
    kind: v.optional(kindValidator),
    tag: v.optional(v.string()),
    sort: v.optional(sortValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<MateriPage> => {
    const { membership } = await requireTenantRole(ctx, args.tenantId, "member"); // authz FIRST (P0)
    const role = membership.role;
    const kind = args.kind ?? "materi";
    const sort = args.sort ?? "newest";
    const order = sort === "oldest" ? "asc" : "desc";
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
        .order(order)
        .paginate(opts);
      const cards: MateriCard[] = [];
      const seen = new Set<string>();
      for (const row of rows.page) {
        if (seen.has(row.lessonId)) continue;
        seen.add(row.lessonId);
        const lesson = await ctx.db.get(row.lessonId);
        if (lesson === null) continue;
        if (lesson.tenantId !== args.tenantId) continue;
        if (materiKind(lesson) !== kind) continue;
        if (!canSeeMateri(lesson, role)) continue;
        cards.push(await toCard(ctx, lesson));
      }
      return {
        page: sortCards(cards, sort),
        isDone: rows.isDone,
        continueCursor: rows.continueCursor,
      };
    }

    const base =
      kind === "skill"
        ? ctx.db
            .query("lessons")
            .withIndex("by_tenant_kind_status", (q) =>
              q.eq("tenantId", args.tenantId).eq("kind", "skill")
            )
            .order(order)
        : ctx.db
            .query("lessons")
            .withIndex("by_tenant_status", (q) => q.eq("tenantId", args.tenantId))
            .order(order)
            // `neq` also keeps rows with no kind column: they are materi.
            .filter((f) => f.neq(f.field("kind"), "skill"));
    // Drafts are excluded IN THE QUERY for everyone below instructor — an
    // absent status is a pre-migration row and counts as published. The skill
    // range could pin status in the index instead, but the "absent means
    // published" rule belongs to access.ts, not to an index range, and a skill
    // written by a seed that omits the column must not silently vanish.
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
    return {
      page: sortCards(page, sort),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * MEMBER+. The tenant's tag cloud with counts, from `lessonTags.by_tenant_tag`
 * (tenant-scoped index range, bounded scan, grouped in memory). Sorted by count
 * desc then alphabetically, and capped.
 *
 * A count is a row count: a draft materi contributes to the count of its tag
 * even for a plain member, and a tag is counted whether it sits on a materi or
 * on a skill. Splitting the cloud by kind would cost one lesson read per tag
 * row; a number reveals nothing — the materi itself stays invisible in
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
