import { defineTable } from "convex/server";
import { v } from "convex/values";

/** PAT credentials are isolated from browser sessions; only digests persist. */
export const mcpTables = {
  mcpTokens: defineTable({
    userId: v.id("users"), tokenHash: v.string(), label: v.string(),
    scope: v.union(v.literal("user"), v.literal("admin")), expiresAt: v.number(),
    lastUsedAt: v.optional(v.number()), minuteStart: v.optional(v.number()),
    minuteCount: v.optional(v.number()), dayStart: v.optional(v.number()), dayCount: v.optional(v.number()),
  }).index("by_tokenHash", ["tokenHash"]).index("by_user", ["userId"]),
};
