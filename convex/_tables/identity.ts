// Table definitions — identity & tenancy. Composed in convex/schema.ts.
// SSOT doc: docs/DATA-MODEL.md. Deviations require updating that doc FIRST.
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const profiles = defineTable({
  userId: v.id("users"),
  username: v.string(), // globally unique — /u/[username]
  displayName: v.string(),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  isPlatformAdmin: v.optional(v.boolean()),
})
  .index("by_user", ["userId"])
  .index("by_username", ["username"]);

export const tenants = defineTable({
  slug: v.string(), // globally unique — /t/[slug]
  name: v.string(),
  description: v.string(),
  coverImageUrl: v.optional(v.string()), // banner image — external https URL (no upload)
  track: v.optional(v.string()), // "umum" | "kerja" | "konten" | other
  discordInviteUrl: v.optional(v.string()),
  // SECRET — must never be returned by any public query (AGENTS.md §6).
  discordWebhookUrl: v.optional(v.string()),
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("suspended")),
  requestMessage: v.optional(v.string()),
  ownerId: v.id("users"),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  // Exact "does this user already hold an open request?" — replaces a bounded
  // by_status scan that stopped firing past 500 global pending rows.
  .index("by_owner_status", ["ownerId", "status"]);

export const memberships = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  role: v.union(v.literal("owner"), v.literal("instructor"), v.literal("member")),
  // v1.8 (#30): gamification points, earned from likes on the member's posts.
  // Optional so every pre-existing membership row stays valid without a backfill;
  // read it as `points ?? 0`. LEVEL IS DERIVED FROM POINTS, NEVER STORED —
  // same rule as convex/features/progress/derive.ts.
  points: v.optional(v.number()),
})
  .index("by_tenant", ["tenantId"])
  .index("by_user", ["userId"])
  .index("by_tenant_user", ["tenantId", "userId"])
  // Leaderboard: ranked read per tenant without scanning every member.
  // Rows with points === undefined sort before 0 in the index.
  .index("by_tenant_points", ["tenantId", "points"]);
