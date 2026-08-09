// posts feature — likes + points (v1.8 #30). One like per user per post via the
// unique by_post_user path. The aggregate is NOT derived at read time: this
// mutation patches `posts.likeCount` AND the AUTHOR's `memberships.points` in
// the SAME transaction as the postLikes row, so the counter, the like and the
// score commit atomically (DATA-MODEL invariant; the retired
// resources/votes.ts countVotes pattern was O(rows × 500) per render).
//
// Scoring rule (help.skool.com/article/31, "1 like = 1 point for the post or
// comment author"): +1 point to the AUTHOR per like, −1 when it is taken back,
// and NEVER a point for liking your own post. `points` is optional on every
// pre-existing membership row — always read it as `points ?? 0`.
import { v } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { mutation, query } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { assertLive, requireMemberForPost } from "./access";
import { clampPageSize } from "./validate";

/** The caller's like row for a post, or null (by_post_user is unique per pair). */
export async function getLike(
  ctx: QueryCtx | MutationCtx,
  postId: Id<"posts">,
  userId: Id<"users">
): Promise<Doc<"postLikes"> | null> {
  return ctx.db
    .query("postLikes")
    .withIndex("by_post_user", (q) => q.eq("postId", postId).eq("userId", userId))
    .unique();
}

/**
 * Move the post AUTHOR's tenant score by `delta`. No-ops when the author has no
 * membership left in that tenant (they left — dangling score must not crash the
 * like). Floors at 0 so a repaired/replayed counter can never go negative.
 */
async function movePoints(
  ctx: MutationCtx,
  post: Doc<"posts">,
  delta: 1 | -1
): Promise<void> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) =>
      q.eq("tenantId", post.tenantId).eq("userId", post.authorId)
    )
    .unique();
  if (membership === null) return; // author left the community — nothing to score
  const current = membership.points ?? 0;
  // Floor at 0: a score is never negative. This DOES drift upward — every
  // membership predating #30 reads as 0, so un-liking a like that was awarded
  // before the counter existed is absorbed instead of subtracted. Accepted:
  // the alternative is storing negative scores, and the board is a fun signal,
  // not an accounting ledger. Skip the write entirely when it would be a no-op
  // so the drift is at least not paid for in transaction cost.
  const next = Math.max(0, current + delta);
  if (next === current) return;
  await ctx.db.patch(membership._id, { points: next });
}

/**
 * Member toggles their like on a post — idempotent: an existing like is
 * removed, a missing one inserted. The read-modify-write runs on the unique
 * by_post_user path inside one serializable mutation, so a double like is
 * impossible. Authz: requireUser BEFORE the post read, then member on the
 * post's OWN tenant (cross-tenant callers get NOT_AUTHORIZED).
 *
 * A NEW like bumps lastActivityAt (feed ordering, DATA-MODEL); un-liking does
 * not un-bump it — activity that happened stays having happened.
 */
export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const { userId, post } = await requireMemberForPost(ctx, args.postId);
    assertLive(post);
    const existing = await getLike(ctx, args.postId, userId);
    const selfLike = post.authorId === userId;

    if (existing !== null) {
      await ctx.db.delete(existing._id);
      const likeCount = Math.max(0, post.likeCount - 1);
      await ctx.db.patch(post._id, { likeCount });
      if (!selfLike) await movePoints(ctx, post, -1); // no self-scoring, ever
      return { liked: false, likeCount };
    }

    await ctx.db.insert("postLikes", {
      tenantId: post.tenantId, // from the post row, never from args
      postId: args.postId,
      userId,
    });
    const likeCount = post.likeCount + 1;
    await ctx.db.patch(post._id, { likeCount, lastActivityAt: Date.now() });
    if (!selfLike) await movePoints(ctx, post, 1);
    return { liked: true, likeCount };
  },
});

/**
 * "Which of these posts have I liked?" for one rendered feed page. Own rows
 * ONLY — requireUser is the first line and every lookup is keyed to the
 * caller's userId, so this can never report anyone else's likes. The input list
 * is capped at one page (clampPageSize), keeping the lookup count bounded.
 * NOT an etalase surface: anonymous readers see counts, never a like state.
 */
export const myLikedPostIds = query({
  args: { postIds: v.array(v.id("posts")) },
  handler: async (ctx, args): Promise<Id<"posts">[]> => {
    const userId = await requireUser(ctx);
    const liked: Id<"posts">[] = [];
    for (const postId of args.postIds.slice(0, clampPageSize(args.postIds.length))) {
      if ((await getLike(ctx, postId, userId)) !== null) liked.push(postId);
    }
    return liked;
  },
});
