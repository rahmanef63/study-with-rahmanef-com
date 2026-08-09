// Seed helpers for the Diskusi feed — `posts` + `postLikes` (DECISIONS #33).
//
// convex/seed.ts used to write four boards: announcements, resources,
// suggestions and suggestionVotes. All four are retired, so a seeded
// announcement is now posts(kind "pengumuman", pinned), a seeded curated link
// is posts(kind "sumber", linkUrl), a seeded suggestion is posts(kind
// "usulan"), and a seeded vote is a `postLikes` row.
//
// Kept OUT of seed.ts because a like is not one insert: it has to move the
// postLikes row, the post's `likeCount` AND the post AUTHOR's
// `memberships.points` together, exactly like features/posts/likes.ts. Seeding
// the rows without the counters would hand the Peringkat board a table of
// zeroes on a freshly seeded deployment.
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Bound on the idempotency probe. The lookup runs on `by_tenant_kind`, so it
 * reads one tenant's posts of ONE kind, not the table (P0: no bare .collect()).
 * A tenant past this many posts of a kind would start re-inserting seed rows —
 * far beyond anything a seed produces, and the seed is never run against a
 * mature community.
 */
const SEED_SCAN_TAKE = 200;

export type SeedPost = {
  tenantId: Id<"tenants">;
  authorId: Id<"users">;
  kind: Doc<"posts">["kind"];
  title: string;
  bodyMd: string;
  /** "sumber" posts: the curated external link. */
  linkUrl?: string;
  pinned?: boolean;
  /** Feed sort key. Defaults to now; stagger it to seed a natural-looking feed. */
  lastActivityAt?: number;
};

/** The seeded post for this (tenant, kind, title), or null. */
export async function findSeededPost(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  kind: Doc<"posts">["kind"],
  title: string
): Promise<Doc<"posts"> | null> {
  const rows = await ctx.db
    .query("posts")
    .withIndex("by_tenant_kind", (q) => q.eq("tenantId", tenantId).eq("kind", kind))
    .take(SEED_SCAN_TAKE);
  return rows.find((p) => p.title === title) ?? null;
}

/**
 * Insert a seed post unless (tenant, kind, title) is already there — the whole
 * seed is re-runnable, so every write is conditional on the destination.
 * `created` tells the caller whether to count it.
 */
export async function upsertSeedPost(
  ctx: MutationCtx,
  post: SeedPost
): Promise<{ postId: Id<"posts">; created: boolean }> {
  const existing = await findSeededPost(ctx, post.tenantId, post.kind, post.title);
  if (existing !== null) return { postId: existing._id, created: false };
  const postId = await ctx.db.insert("posts", {
    tenantId: post.tenantId,
    authorId: post.authorId,
    kind: post.kind,
    title: post.title,
    bodyMd: post.bodyMd,
    linkUrl: post.linkUrl,
    pinned: post.pinned ?? false,
    lastActivityAt: post.lastActivityAt ?? Date.now(),
    likeCount: 0,
    commentCount: 0,
  });
  return { postId, created: true };
}

/** +1 to the post AUTHOR's tenant score. No-op when they are not a member. */
async function awardPoint(ctx: MutationCtx, post: Doc<"posts">): Promise<void> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) =>
      q.eq("tenantId", post.tenantId).eq("userId", post.authorId)
    )
    .unique();
  if (membership === null) return;
  await ctx.db.patch(membership._id, { points: (membership.points ?? 0) + 1 });
}

/**
 * One seeded like: the row, the counter and the author's point, in one
 * transaction. Idempotent through the unique by_post_user index. Mirrors
 * likes.ts on scoring — NO point for liking your own post.
 */
export async function likeSeedPost(
  ctx: MutationCtx,
  postId: Id<"posts">,
  userId: Id<"users">
): Promise<boolean> {
  const post = await ctx.db.get(postId);
  if (post === null) return false;
  const existing = await ctx.db
    .query("postLikes")
    .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
    .unique();
  if (existing !== null) return false;

  await ctx.db.insert("postLikes", {
    tenantId: post.tenantId, // from the post row, never from an arg
    postId,
    userId,
  });
  await ctx.db.patch(postId, { likeCount: post.likeCount + 1 });
  if (post.authorId !== userId) await awardPoint(ctx, post);
  return true;
}
