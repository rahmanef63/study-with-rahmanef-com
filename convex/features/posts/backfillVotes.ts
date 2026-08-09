// posts feature — suggestionVotes → postLikes for the one-shot backfill (#33).
//
// Kept apart from backfillMap.ts because a vote migration is not an insert: it
// has to move THREE things atomically, exactly like the live like path
// (features/posts/likes.ts) — the postLikes row, the target post's likeCount,
// and the post AUTHOR's memberships.points. Migrating the rows without the
// counters would hand every historically-voted post a likeCount of 0 and start
// the Peringkat board from zero, throwing away the very history this backfill
// exists to preserve.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { findMigratedPost, suggestionKey } from "./backfillMap";

type Ctx = QueryCtx | MutationCtx;

/** Resolve the post a legacy vote now points at, or null if unmigrated/dangling. */
export async function postForVote(
  ctx: Ctx,
  vote: Doc<"suggestionVotes">
): Promise<Doc<"posts"> | null> {
  const suggestion = await ctx.db.get(vote.suggestionId);
  if (suggestion === null) return null; // dangling vote — nothing to attach to
  return findMigratedPost(ctx, suggestionKey(suggestion));
}

/** The already-migrated like for this vote, or null (by_post_user is unique). */
export async function likeForVote(
  ctx: Ctx,
  postId: Id<"posts">,
  userId: Id<"users">
): Promise<Doc<"postLikes"> | null> {
  return ctx.db
    .query("postLikes")
    .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
    .unique();
}

/** +1 to the post AUTHOR's tenant score. No-op when they left the community. */
async function awardPoint(ctx: MutationCtx, post: Doc<"posts">): Promise<void> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) =>
      q.eq("tenantId", post.tenantId).eq("userId", post.authorId)
    )
    .unique();
  if (membership === null) return; // author left the community — nothing to score
  await ctx.db.patch(membership._id, { points: (membership.points ?? 0) + 1 });
}

/**
 * One vote → one like. Idempotent through the UNIQUE by_post_user index: the
 * existence check and the counter bump live in the same mutation, so a replayed
 * batch can never double-count a like or a point.
 *
 * Returns false — "nothing to do" — when the vote is dangling, when its
 * suggestion has not been migrated yet (the votes phase always runs last, so
 * this only happens on a partial run), or when the like already exists.
 *
 * Mirrors likes.ts on scoring: NO point for liking your own post.
 */
export async function migrateVote(
  ctx: MutationCtx,
  vote: Doc<"suggestionVotes">
): Promise<boolean> {
  const post = await postForVote(ctx, vote);
  if (post === null) return false;
  if ((await likeForVote(ctx, post._id, vote.userId)) !== null) return false;

  await ctx.db.insert("postLikes", {
    tenantId: post.tenantId, // from the post row, never from the legacy vote
    postId: post._id,
    userId: vote.userId,
  });
  await ctx.db.patch(post._id, { likeCount: post.likeCount + 1 });
  if (post.authorId !== vote.userId) await awardPoint(ctx, post); // no self-scoring
  return true;
}
