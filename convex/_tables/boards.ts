// Table definitions — the in-app notification inbox. Composed in convex/schema.ts.
// SSOT doc: docs/DATA-MODEL.md.
//
// `resources`, `suggestions`, `suggestionVotes` and `announcements` USED to live
// here. They were folded into `posts` (kind sumber / usulan / pengumuman) by
// #29/#33, backfilled against production on 2026-08-09 (23 rows → posts, 17
// votes → postLikes with their points), verified, and their source rows purged
// to zero before these definitions were removed — a table dropped while rows
// remain leaves data nothing can read or delete. The one-shot migration module
// (features/posts/backfill*) went in the same commit; `git log` has it.
import { defineTable } from "convex/server";
import { v } from "convex/values";

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
