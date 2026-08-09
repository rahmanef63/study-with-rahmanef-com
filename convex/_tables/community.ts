// Table definitions — Diskusi feed, likes, comments, Kalender.
// Composed in convex/schema.ts. SSOT doc: docs/DATA-MODEL.md.
import { defineTable } from "convex/server";
import { v } from "convex/values";

// v1.8 (#29/#33): the Diskusi feed. One table absorbs what used to be three
// boards — announcements, curated resources, suggestions — discriminated by
// `kind`. The old curation gate (pending/approved/rejected) is gone; moderation
// is post-hoc (soft delete + pin).
export const posts = defineTable({
  tenantId: v.id("tenants"),
  authorId: v.id("users"),
  kind: v.union(
    v.literal("diskusi"), // tanya-jawab / obrolan async
    v.literal("pengumuman"), // instructor+ only, enforced in the mutation
    v.literal("usulan"), // suggestion box successor
    v.literal("sumber") // curated external link successor
  ),
  title: v.string(),
  bodyMd: v.string(),
  linkUrl: v.optional(v.string()), // "sumber" posts: the curated external link
  youtubeVideoId: v.optional(v.string()), // 11-char id, never a full URL (mirrors lessons)
  pinned: v.boolean(),
  // Bumped on new comment/like; the feed sorts on it (see by_tenant_pinned_activity).
  lastActivityAt: v.number(),
  // DENORMALISED COUNTERS — stored, never derived. The pattern this replaces
  // (resources/votes.ts countVotes doing .take(500) per row inside a list map)
  // is O(rows x 500) per render and will not survive a feed. Every writer that
  // touches postLikes / comments MUST patch the matching counter in the same
  // mutation, so the counter and the rows commit atomically.
  likeCount: v.number(),
  commentCount: v.number(),
  deletedAt: v.optional(v.number()), // soft delete (author or instructor+)
})
  // Feed read: pinned rows first, newest activity first, in one index range.
  .index("by_tenant_pinned_activity", ["tenantId", "pinned", "lastActivityAt"])
  .index("by_tenant_kind", ["tenantId", "kind"])
  .index("by_author", ["authorId"])
  .searchIndex("search_title", { searchField: "title", filterFields: ["tenantId"] });

// v1.8 (#30): one like per user per post — a direct generalisation of
// suggestionVotes. Unlike suggestionVotes the aggregate is NOT derived here;
// posts.likeCount is the read path, this table only enforces uniqueness and
// answers "did I like it?" via by_post_user.
export const postLikes = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  postId: v.id("posts"),
})
  .index("by_post", ["postId"])
  .index("by_post_user", ["postId", "userId"])
  .index("by_user", ["userId"]);

// fase-2 (#16), widened v1.8 (#29): comments now hang off EITHER a lesson OR a
// post. Both FKs are optional and exactly one must be set — guarded in the
// mutation, not the schema. This dual-optional-FK shape is deliberate over a
// polymorphic targetKind + targetId: v.string(): it keeps Id<> type safety at
// every call site. Every pre-pivot lesson comment row stays valid as-is; no
// data migration.
export const comments = defineTable({
  tenantId: v.id("tenants"),
  lessonId: v.optional(v.id("lessons")), // set for lesson comments
  postId: v.optional(v.id("posts")), // set for Diskusi post replies
  userId: v.id("users"),
  bodyMd: v.string(),
  parentId: v.optional(v.id("comments")), // reply target; depth-1 enforced in mutation
  deletedAt: v.optional(v.number()), // soft delete (author or instructor+)
})
  .index("by_lesson", ["lessonId"])
  .index("by_post", ["postId"])
  .index("by_parent", ["parentId"])
  .index("by_user", ["userId"])
  // Anti-spam counts the caller's own comments on ONE target exactly. The old
  // by_lesson + bounded .take() scanned the OLDEST rows, so past the window
  // the per-user cap could never fire. by_post_user mirrors that fix for posts.
  .index("by_lesson_user", ["lessonId", "userId"])
  .index("by_post_user", ["postId", "userId"]);

// v1.8 (#31): Kalender, thinnest possible version. DISCRETE ROWS ONLY — there
// is no recurrence rule and there must never be one; a "repeat weekly x N" UI
// inserts N rows in a single mutation. Recurrence (RRULE, exceptions, timezone
// expansion) is the classic over-engineering trap for this feature.
export const events = defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  description: v.optional(v.string()),
  startsAt: v.number(), // epoch ms, UTC
  endsAt: v.optional(v.number()), // epoch ms; open-ended when absent
  locationUrl: v.optional(v.string()), // Discord/YouTube link — never a physical address
  createdBy: v.id("users"),
  canceledAt: v.optional(v.number()), // soft cancel; the row stays visible, struck through
}).index("by_tenant_start", ["tenantId", "startsAt"]);
