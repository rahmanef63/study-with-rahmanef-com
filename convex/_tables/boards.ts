// Table definitions — legacy boards (resources / suggestions / announcements)
// and the in-app notification inbox. Composed in convex/schema.ts.
// SSOT doc: docs/DATA-MODEL.md.
//
// RETIRED-BUT-RETAINED (#29/#33): `resources`, `suggestions`, `suggestionVotes`
// and `announcements` are superseded by `posts` (kind sumber / usulan /
// pengumuman). Every feature that read or wrote them is DELETED — these four
// definitions are the last thing keeping them alive, and they stay ONLY because
// production rows still exist and `defineSchema` validates every declared table.
//
// AWAITING THE BACKFILL. The migration is written and tested:
//   convex/features/posts/backfill.ts  (run → migrate, remaining → verify)
// Sequence: run `backfill:run` to completion against prod → assert
// `backfill:remaining` reports announcements/resources/suggestions/votes all 0
// (`rejectedResources` may be non-zero — those are skipped by design, #33) →
// THEN drop these four tables and the backfill module in a separate commit.
//
// NO WRITER LEFT. convex/seed.ts was the last one outside the backfill; it now
// seeds `posts` + `postLikes` through convex/_seed/posts.ts, so a re-run can no
// longer re-create unmigrated rows (asserted in convex/seed.test.ts). The only
// code that still names these tables is the backfill and its tests, which the
// table-drop commit deletes along with the definitions below.
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const resources = defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  url: v.string(),
  note: v.optional(v.string()),
  courseId: v.optional(v.id("courses")),
  submittedBy: v.id("users"),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  reviewedBy: v.optional(v.id("users")),
})
  .index("by_tenant_status", ["tenantId", "status"])
  .index("by_submitter", ["submittedBy"]);

export const suggestions = defineTable({
  // course/topic suggestion box (PRD R9)
  tenantId: v.id("tenants"),
  title: v.string(),
  detail: v.optional(v.string()),
  submittedBy: v.id("users"),
  status: v.union(
    v.literal("open"),
    v.literal("planned"),
    v.literal("done"),
    v.literal("rejected")
  ),
}).index("by_tenant_status", ["tenantId", "status"]);

export const suggestionVotes = defineTable({
  // fase-2 (#18): one vote per user per suggestion; count derived, never stored.
  tenantId: v.id("tenants"),
  suggestionId: v.id("suggestions"),
  userId: v.id("users"),
})
  .index("by_suggestion", ["suggestionId"])
  .index("by_suggestion_user", ["suggestionId", "userId"])
  .index("by_user", ["userId"]);

export const notifications = defineTable({
  // fase-2 (#21): inbox in-app per user. Producers menjadwalkan internal
  // mutation notifications (comment reply, hasil kurasi, status usulan;
  // v1.4 #28: pengumuman komunitas — fan-out bounded ke members).
  userId: v.id("users"), // penerima
  tenantId: v.id("tenants"),
  kind: v.union(
    v.literal("comment_reply"),
    // RETIRED-BUT-RETAINED: no new row carries these two literals (the curation
    // gate and the suggestion board are gone, #33). Production rows written
    // before v1.8 still do, and narrowing a union under an already-populated
    // table fails the deploy. Remove ONLY after a backfill/purge of those rows.
    v.literal("resource_reviewed"),
    v.literal("suggestion_status"),
    v.literal("announcement"),
    // v1.8 additions
    v.literal("post_reply"), // someone replied to your Diskusi post
    v.literal("event_soon") // a Kalender event you can attend starts soon
  ),
  title: v.string(),
  body: v.optional(v.string()),
  href: v.optional(v.string()), // deep-link (pre-pivot paths covered by next.config redirects)
  readAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "readAt"]);

export const announcements = defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  bodyMd: v.string(),
  createdBy: v.id("users"),
  postedToDiscord: v.boolean(),
}).index("by_tenant", ["tenantId"]);
