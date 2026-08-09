// posts feature — access helpers. Every public function's handler calls one of
// these before touching data (P0 server-side authz; route guards are UX).
// Protected helpers authenticate (requireUser) BEFORE any by-ID read, so
// anonymous callers are rejected before a domain row is touched — no existence
// oracle (pattern: convex/features/comments/access.ts).
//
// tenantId is ALWAYS taken from the POST row, never from args.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Post by id or NOT_FOUND. */
export async function getPostOrFail(ctx: Ctx, postId: Id<"posts">): Promise<Doc<"posts">> {
  const post = await ctx.db.get(postId);
  if (post === null) fail("NOT_FOUND", "Post tidak ditemukan");
  return post;
}

/** A soft-deleted post accepts no further writes (like/comment/edit/pin). */
export function assertLive(post: Doc<"posts">): void {
  if (post.deletedAt !== undefined) fail("NOT_FOUND", "Post sudah dihapus");
}

/**
 * Member-tier authz on the post's OWN tenant (like / comment / read-back).
 * Auth FIRST, then resolve the post, then the role check.
 */
export async function requireMemberForPost(
  ctx: Ctx,
  postId: Id<"posts">
): Promise<{ userId: Id<"users">; membership: Doc<"memberships">; post: Doc<"posts"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const post = await getPostOrFail(ctx, postId);
  const { userId, membership } = await requireTenantRole(ctx, post.tenantId, "member");
  return { userId, membership, post };
}

/**
 * Edit / soft-delete authz (DATA-MODEL: "soft-delete: author atau instructor+").
 * The rule is STILL A MEMBER **and** (author or instructor+): membership is
 * checked on both branches, not just the non-author one. Without the author-branch
 * check a user removed or banned from a community kept full edit rights over
 * posts that stay live on an anonymously readable, sitemap-indexed feed — so
 * "remove this member" would not have stopped them editing their own content.
 */
export async function requireAuthorOrInstructorForPost(
  ctx: Ctx,
  postId: Id<"posts">
): Promise<{ userId: Id<"users">; post: Doc<"posts"> }> {
  const userId = await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const post = await getPostOrFail(ctx, postId);
  await requireTenantRole(ctx, post.tenantId, post.authorId === userId ? "member" : "instructor");
  return { userId, post };
}

/** Pin/unpin authz — instructor+ ONLY, never the plain author (moderation). */
export async function requireInstructorForPost(
  ctx: Ctx,
  postId: Id<"posts">
): Promise<{ userId: Id<"users">; post: Doc<"posts"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const post = await getPostOrFail(ctx, postId);
  const { userId } = await requireTenantRole(ctx, post.tenantId, "instructor");
  return { userId, post };
}
