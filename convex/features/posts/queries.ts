// posts feature — read surface (v1.8 #29). Every read is indexed + bounded
// (paginate / .take), never a bare .collect().
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6): publicListFeed, publicGetPost.
// These two are the ONLY anonymous surface of this feature. Each qualifies
// because ALL of the following hold:
//   1. the name starts with `public` (auditable) AND is listed here;
//   2. it reads live rows only — the tenant is re-checked ACTIVE via
//      requireActiveTenantById and `deletedAt` rows are excluded — through the
//      by_tenant_pinned_activity index, or (permalink) a by-id get that
//      re-checks both statuses before returning anything (precedent:
//      features/profiles/public.ts publicGetCertificate);
//   3. it returns the EXPLICIT toPublicPost projection — never a raw doc, never
//      an id beyond the post's own, never user data past the same three
//      public-profile fields /u/<username> already publishes.
// WHY anonymous (authorised by DECISIONS #29 + this wave's assignment): a post
// permalink has to unfurl and be indexable for a logged-out recipient — that is
// the whole point of the feature. The COMPOSER, likes and the comment thread
// stay membership-gated. Mutations never qualify (§6).
// `listMine` below authenticates on its first line, like every other query.
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import { query, type QueryCtx } from "../../_generated/server";
import { requireActiveTenantById, requireTenantRole } from "../../_shared/auth";
import {
  distinctAuthorIds,
  toMinePost,
  toPostAuthor,
  toPublicPost,
  type MinePost,
  type PostAuthor,
  type PublicPost,
  type PublicPostPage,
} from "./projections";
import { clampPageSize, MINE_SCAN_TAKE, MINE_TAKE } from "./validate";

const kindValidator = v.union(
  v.literal("diskusi"),
  v.literal("pengumuman"),
  v.literal("usulan"),
  v.literal("sumber")
);

/** One indexed profile lookup per DISTINCT author of the page (bounded by the page size). */
async function loadAuthors(
  ctx: QueryCtx,
  rows: Doc<"posts">[]
): Promise<Map<Id<"users">, PostAuthor>> {
  const authors = new Map<Id<"users">, PostAuthor>();
  for (const authorId of distinctAuthorIds(rows)) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", authorId))
      .unique();
    authors.set(authorId, toPostAuthor(profile));
  }
  return authors;
}

/**
 * ANONYMOUS community feed: pinned rows first, then newest activity first, in
 * ONE index range (by_tenant_pinned_activity descending — Convex sorts
 * false < true, so `.order("desc")` puts pinned rows on top). Cursor-paginated;
 * `kind` narrows the same range so the ordering survives the filter.
 * Soft-deleted rows are filtered in the query, so a page is never short-changed
 * by post-hoc trimming. A suspended/pending community answers NOT_FOUND.
 */
export const publicListFeed = query({
  args: {
    tenantId: v.id("tenants"),
    kind: v.optional(kindValidator),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PublicPostPage> => {
    // Guard for an anonymous read: active tenant only (§6) + safe projection.
    await requireActiveTenantById(ctx, args.tenantId);
    const result = await ctx.db
      .query("posts")
      .withIndex("by_tenant_pinned_activity", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .filter((f) =>
        args.kind === undefined
          ? f.eq(f.field("deletedAt"), undefined)
          : f.and(
              f.eq(f.field("deletedAt"), undefined),
              f.eq(f.field("kind"), args.kind)
            )
      )
      .paginate({
        ...args.paginationOpts,
        numItems: clampPageSize(args.paginationOpts.numItems),
      });
    const authors = await loadAuthors(ctx, result.page);
    return {
      page: result.page.map((p) => toPublicPost(p, authors.get(p.authorId) ?? null)),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

/**
 * ANONYMOUS post permalink (`/k/<slug>/post/<id>` — SSR + OG unfurl).
 * `null` when the post is unknown or soft-deleted (indistinguishable, by
 * design); NOT_FOUND when the community is not active, exactly like every
 * other by-id etalase read.
 */
export const publicGetPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args): Promise<PublicPost | null> => {
    const post = await ctx.db.get(args.postId);
    if (post === null || post.deletedAt !== undefined) return null;
    await requireActiveTenantById(ctx, post.tenantId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", post.authorId))
      .unique();
    return toPublicPost(post, toPostAuthor(profile));
  },
});

/**
 * The caller's OWN posts in this community — MEMBER+, userId from ctx.
 * The scan runs on by_author (the caller's rows ONLY) ordered NEWEST-FIRST, so
 * a post the caller just wrote is always inside the window. This is the exact
 * inverse of the retired boards, where `listMineResources` walked a by_tenant
 * window shared with every other member and a member's own fresh submission
 * fell off the end — "kiriman saya hilang".
 */
export const listMine = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args): Promise<MinePost[]> => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(MINE_SCAN_TAKE);
    return rows
      .filter((p) => p.tenantId === args.tenantId && p.deletedAt === undefined)
      .slice(0, MINE_TAKE)
      .map(toMinePost);
  },
});
