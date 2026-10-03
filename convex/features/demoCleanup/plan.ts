import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { SEED_THREADS } from "../../_seed/engagementData";
import { refuse, verifyDemo } from "./provenance";

type Ctx = QueryCtx | MutationCtx;
export const CAP = 200;
export async function buildPlan(ctx: Ctx, userIds: Id<"users">[]) {
  if (!userIds.length || userIds.length > 3 || new Set(userIds).size !== userIds.length) refuse();
  let reads = 0;
  const bounded = <T>(rows: T[]): T[] => {
    reads += rows.length;
    if (rows.length > CAP || reads > 4000) refuse();
    return rows;
  };
  const users = [];
  const comments = new Map<string, Doc<"comments">>();
  const posts = new Map<string, Doc<"posts">>();
  const likes = new Map<string, Doc<"postLikes">>();
  const completions: Doc<"lessonCompletions">[] = [];
  const badges: Doc<"courseCompletions">[] = [];
  const attempts: Doc<"quizAttempts">[] = [];
  const notifications: Doc<"notifications">[] = [];
  const assessments: Doc<"learnerProfiles">[] = [];
  const views: Doc<"materiViews">[] = [];
  for (const userId of userIds) {
    const verified = await verifyDemo(ctx, userId);
    if (!verified) continue;
    users.push(verified);
    for (const row of bounded(await ctx.db.query("comments").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1))) comments.set(row._id, row);
    for (const row of bounded(await ctx.db.query("posts").withIndex("by_author", (q) => q.eq("authorId", userId)).take(CAP + 1))) posts.set(row._id, row);
    for (const row of bounded(await ctx.db.query("postLikes").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1))) likes.set(row._id, row);
    completions.push(...bounded(await ctx.db.query("lessonCompletions").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1)));
    badges.push(...bounded(await ctx.db.query("courseCompletions").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1)));
    attempts.push(...bounded(await ctx.db.query("quizAttempts").withIndex("by_user_quiz", (q) => q.eq("userId", userId)).take(CAP + 1)));
    notifications.push(...bounded(await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1)));
    assessments.push(...bounded(await ctx.db.query("learnerProfiles").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1)));
    views.push(...bounded(await ctx.db.query("materiViews").withIndex("by_user", (q) => q.eq("userId", userId)).take(CAP + 1)));
  }
  // A synthetic question can have an exact scripted owner response. Real replies survive.
  for (const root of [...comments.values()]) {
    const replies = bounded(await ctx.db.query("comments").withIndex("by_parent", (q) => q.eq("parentId", root._id)).take(CAP + 1));
    const owner = (await ctx.db.get(root.tenantId))?.ownerId;
    const script = SEED_THREADS.find((thread) => thread.root.bodyMd === root.bodyMd);
    for (const reply of replies) {
      if (script?.reply?.author === "rahman" && reply.userId === owner && reply.bodyMd === script.reply.bodyMd) comments.set(reply._id, reply);
    }
  }
  const tombstones = new Map<string, Id<"users">>();
  for (const post of posts.values()) {
    const postComments = bounded(await ctx.db.query("comments").withIndex("by_post", (q) => q.eq("postId", post._id)).take(CAP + 1));
    if (postComments.some((comment) => !comments.has(comment._id))) {
      const ownerId = (await ctx.db.get(post.tenantId))?.ownerId;
      if (!ownerId || userIds.includes(ownerId)) refuse();
      tombstones.set(post._id, ownerId);
    }
    for (const like of bounded(await ctx.db.query("postLikes").withIndex("by_post", (q) => q.eq("postId", post._id)).take(CAP + 1))) likes.set(like._id, like);
  }
  const promoted = new Map<string, Doc<"comments">>();
  for (const comment of comments.values()) {
    for (const reply of bounded(await ctx.db.query("comments").withIndex("by_parent", (q) => q.eq("parentId", comment._id)).take(CAP + 1))) {
      if (!comments.has(reply._id)) promoted.set(reply._id, reply);
    }
  }
  // Unique learner counters subtract exactly one viewer for each deleted user/lesson.
  const removedViews = new Map<string, { tenantId: Id<"tenants">; lessonId: Id<"lessons">; views: number; users: Set<string>; lastViewedAt: number }>();
  for (const view of views) {
    const aggregate = removedViews.get(view.lessonId) ?? { tenantId: view.tenantId, lessonId: view.lessonId, views: 0, users: new Set<string>(), lastViewedAt: 0 };
    aggregate.views++;
    aggregate.users.add(view.userId);
    removedViews.set(view.lessonId, aggregate);
  }
  const removedViewIds = new Set(views.map((view) => view._id));
  for (const removed of removedViews.values()) {
    const remaining = bounded(await ctx.db.query("materiViews")
      .withIndex("by_lesson_user_day", (q) => q.eq("lessonId", removed.lessonId)).take(CAP + 1));
    removed.lastViewedAt = Math.max(0, ...remaining.filter((view) => !removedViewIds.has(view._id)).map((view) => view._creationTime));
  }
  const maximumWrites = likes.size * 4 + comments.size * 2 + posts.size + promoted.size +
    completions.length + badges.length + attempts.length + notifications.length + assessments.length + views.length +
    removedViews.size + users.reduce((count, user) => count + user.memberships.length + 2, 0);
  if (maximumWrites > 6000) refuse();
  return { users, comments, posts, likes, completions, badges, attempts, notifications, assessments, views, tombstones, promoted, removedViews };
}

export type Plan = Awaited<ReturnType<typeof buildPlan>>;
export function summary(plan: Plan) {
  return {
    users: plan.users.length, profiles: plan.users.length,
    memberships: plan.users.reduce((total, user) => total + user.memberships.length, 0),
    comments: plan.comments.size, posts: plan.posts.size - plan.tombstones.size,
    postTombstones: plan.tombstones.size, postLikes: plan.likes.size,
    promotedReplies: plan.promoted.size, lessonCompletions: plan.completions.length,
    courseCompletions: plan.badges.length, quizAttempts: plan.attempts.length,
    notifications: plan.notifications.length, learnerProfiles: plan.assessments.length, materiViews: plan.views.length,
  };
}
