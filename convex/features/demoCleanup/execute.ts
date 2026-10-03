import type { MutationCtx } from "../../_generated/server";
import type { Plan } from "./plan";

export async function executePlan(ctx: MutationCtx, plan: Plan) {
  // Reverse exactly the removed like's score contribution, preserving unrelated points.
  for (const like of plan.likes.values()) {
    const post = await ctx.db.get(like.postId);
    if (post) {
      await ctx.db.patch(post._id, { likeCount: Math.max(0, post.likeCount - 1) });
      if (post.authorId !== like.userId) {
        const member = await ctx.db.query("memberships").withIndex("by_tenant_user", (q) => q.eq("tenantId", post.tenantId).eq("userId", post.authorId)).unique();
        if (member) await ctx.db.patch(member._id, { points: Math.max(0, (member.points ?? 0) - 1) });
      }
    }
    await ctx.db.delete(like._id);
  }
  for (const reply of plan.promoted.values()) await ctx.db.patch(reply._id, { parentId: undefined });
  for (const comment of plan.comments.values()) {
    if (comment.postId && comment.deletedAt === undefined) {
      const post = await ctx.db.get(comment.postId);
      if (post) await ctx.db.patch(post._id, { commentCount: Math.max(0, post.commentCount - 1) });
    }
    await ctx.db.delete(comment._id);
  }
  for (const post of plan.posts.values()) {
    const ownerId = plan.tombstones.get(post._id);
    if (ownerId) await ctx.db.patch(post._id, {
      authorId: ownerId, title: "Konten demo dihapus", bodyMd: "", linkUrl: undefined,
      youtubeVideoId: undefined, deletedAt: Date.now(), likeCount: 0, pinned: false,
    });
    else await ctx.db.delete(post._id);
  }
  for (const removed of plan.removedViews.values()) {
    const rollup = await ctx.db.query("materiViewCounts").withIndex("by_tenant_lesson", (q) => q.eq("tenantId", removed.tenantId).eq("lessonId", removed.lessonId)).unique();
    if (rollup) {
      if (!removed.lastViewedAt) await ctx.db.delete(rollup._id);
      else await ctx.db.patch(rollup._id, {
        views: Math.max(0, rollup.views - removed.views), viewers: Math.max(0, rollup.viewers - removed.users.size),
        lastViewedAt: removed.lastViewedAt,
      });
    }
  }
  for (const row of [...plan.completions, ...plan.badges, ...plan.attempts, ...plan.notifications, ...plan.assessments, ...plan.views]) await ctx.db.delete(row._id);
  for (const user of plan.users) {
    for (const membership of user.memberships) await ctx.db.delete(membership._id);
    await ctx.db.delete(user.profile!._id);
    await ctx.db.delete(user.user._id);
  }
}
