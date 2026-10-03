import { defineTable } from "convex/server";
import { v } from "convex/values";
import { activityFields } from "./contract";

/** Authenticated activity never joins or changes the anonymous visitor stream. */
export const userAnalyticsTables = {
  userActivityEvents: defineTable({
    userId: v.id("users"), at: v.number(), expiresAt: v.number(), ...activityFields,
  }).index("by_user_at", ["userId", "at"]).index("by_at", ["at"]).index("by_expiry", ["expiresAt"]),
  userActivityBudgets: defineTable({
    userId: v.id("users"), minuteResetAt: v.number(), minuteCount: v.number(),
    dayResetAt: v.number(), dayCount: v.number(), expiresAt: v.number(),
  }).index("by_user", ["userId"]).index("by_expiry", ["expiresAt"]),
  userActivityDailyBudgets: defineTable({
    day: v.string(), accepted: v.number(), expiresAt: v.number(),
  }).index("by_day", ["day"]).index("by_expiry", ["expiresAt"]),
};
