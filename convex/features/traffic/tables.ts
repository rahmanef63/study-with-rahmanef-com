import { defineTable } from "convex/server";
import { v } from "convex/values";
import { eventFields } from "./contract";

/** Platform traffic is separate from tenant learning; never joined to accounts. */
export const trafficTables = {
  trafficEvents: defineTable({ ...eventFields, at: v.number() }).index("by_at", ["at"]),
  trafficBudgets: defineTable({ day: v.string(), accepted: v.number(), dropped: v.number(), expiresAt: v.number() })
    .index("by_day", ["day"]).index("by_expiry", ["expiresAt"]),
  trafficRateLimits: defineTable({
    bucket: v.string(), minuteResetAt: v.number(), minuteCount: v.number(), dayCount: v.number(), expiresAt: v.number(),
  }).index("by_bucket", ["bucket"]).index("by_expiry", ["expiresAt"]),
};
