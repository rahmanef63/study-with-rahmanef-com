// Operator-only cleanup: never expose these functions through MCP or a client.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import { requirePlatformAdmin } from "../../_shared/auth";
import { buildPlan, summary } from "./plan";
import { executePlan } from "./execute";

const counts = v.object({
  users: v.number(), profiles: v.number(), memberships: v.number(),
  comments: v.number(), posts: v.number(), postTombstones: v.number(),
  postLikes: v.number(), promotedReplies: v.number(), lessonCompletions: v.number(),
  courseCompletions: v.number(), quizAttempts: v.number(), notifications: v.number(),
  learnerProfiles: v.number(), materiViews: v.number(),
});

export const preview = internalQuery({
  args: { userIds: v.array(v.id("users")) }, returns: counts,
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return summary(await buildPlan(ctx, args.userIds));
  },
});

export const execute = internalMutation({
  args: { userIds: v.array(v.id("users")), confirmation: v.literal("DELETE_VERIFIED_SEED_ACCOUNTS") },
  returns: counts,
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const plan = await buildPlan(ctx, args.userIds); // Recheck evidence in the same transaction.
    const result = summary(plan);
    await executePlan(ctx, plan);
    return result;
  },
});
