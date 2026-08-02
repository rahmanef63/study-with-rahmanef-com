// Schema SSOT — docs/DATA-MODEL.md. Deviations require updating that doc FIRST
// via the integrator (AGENTS.md §4). Full multi-tenant from day 1: every domain
// table carries tenantId. `_creationTime` is the timestamp (no manual createdAt).
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { pageviewTables } from "./features/pageviews/tables";

export default defineSchema({
  ...authTables,
  // Cookieless visitor analytics (feature-owned tables spread in). See
  // convex/features/pageviews/tables.ts.
  ...pageviewTables,

  // Singleton site config from the rr starter (branding). Bounded: one row.
  siteSettings: defineTable({
    siteName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    themeDefault: v.optional(v.string()),
    themePreset: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    socials: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    analyticsId: v.optional(v.string()),
    onboardedAt: v.optional(v.number()),
  }),

  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(), // globally unique — /u/[username]
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    isPlatformAdmin: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"]),

  tenants: defineTable({
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
    .index("by_status", ["status"]),

  memberships: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("instructor"), v.literal("member")),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_user", ["userId"])
    .index("by_tenant_user", ["tenantId", "userId"]),

  courses: defineTable({
    tenantId: v.id("tenants"),
    slug: v.string(), // unique per tenant
    title: v.string(),
    description: v.string(),
    coverImageUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    createdBy: v.id("users"),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_slug", ["tenantId", "slug"])
    .index("by_tenant_status", ["tenantId", "status"])
    // fase-2 (#23): pencarian judul kelas per tenant
    .searchIndex("search_title", { searchField: "title", filterFields: ["tenantId", "status"] }),

  modules: defineTable({
    tenantId: v.id("tenants"),
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
  }).index("by_course", ["courseId"]),

  lessons: defineTable({
    tenantId: v.id("tenants"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
    title: v.string(),
    youtubeVideoId: v.optional(v.string()), // 11-char ID, never a full URL
    contentMd: v.string(),
    links: v.array(v.object({ label: v.string(), url: v.string() })),
    order: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_course", ["courseId"])
    // fase-2 (#23): pencarian materi per tenant (filter tenantId; draft-guard di query)
    .searchIndex("search_content", { searchField: "contentMd", filterFields: ["tenantId"] }),

  lessonCompletions: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
  })
    .index("by_user_lesson", ["userId", "lessonId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_course", ["courseId"])
    // v1.7 (#37): "Lanjutkan belajar" lintas perangkat — recents per user
    // terurut _creationTime di dalam index.
    .index("by_user", ["userId"]),

  courseCompletions: defineTable({
    // = badge (PRD R11)
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    courseId: v.id("courses"),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"]),

  quizzes: defineTable({
    tenantId: v.id("tenants"),
    courseId: v.id("courses"),
    moduleId: v.id("modules"),
    title: v.string(),
    passingScorePct: v.number(),
    questions: v.array(
      v.object({
        prompt: v.string(),
        options: v.array(v.string()),
        // SECRET — strip from all public reads; grading is server-side (AGENTS.md §6).
        correctIndex: v.number(),
        explanation: v.optional(v.string()),
      })
    ),
  }).index("by_module", ["moduleId"]),

  quizAttempts: defineTable({
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
    scorePct: v.number(),
    passed: v.boolean(),
  })
    .index("by_user_quiz", ["userId", "quizId"])
    .index("by_quiz", ["quizId"]),

  resources: defineTable({
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
    .index("by_submitter", ["submittedBy"]),

  suggestions: defineTable({
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
  }).index("by_tenant_status", ["tenantId", "status"]),

  comments: defineTable({
    // fase-2 (#16): diskusi per lesson, 1-level reply (root -> replies only).
    tenantId: v.id("tenants"),
    lessonId: v.id("lessons"),
    userId: v.id("users"),
    bodyMd: v.string(),
    parentId: v.optional(v.id("comments")), // reply target; depth-1 enforced in mutation
    deletedAt: v.optional(v.number()), // soft delete (author or instructor+)
  })
    .index("by_lesson", ["lessonId"])
    .index("by_parent", ["parentId"])
    .index("by_user", ["userId"]),

  suggestionVotes: defineTable({
    // fase-2 (#18): one vote per user per suggestion; count derived, never stored.
    tenantId: v.id("tenants"),
    suggestionId: v.id("suggestions"),
    userId: v.id("users"),
  })
    .index("by_suggestion", ["suggestionId"])
    .index("by_suggestion_user", ["suggestionId", "userId"])
    .index("by_user", ["userId"]),

  notifications: defineTable({
    // fase-2 (#21): inbox in-app per user. Producers menjadwalkan internal
    // mutation notifications (comment reply, hasil kurasi, status usulan;
    // v1.4 #28: pengumuman komunitas — fan-out bounded ke members).
    userId: v.id("users"), // penerima
    tenantId: v.id("tenants"),
    kind: v.union(
      v.literal("comment_reply"),
      v.literal("resource_reviewed"),
      v.literal("suggestion_status"),
      v.literal("announcement")
    ),
    title: v.string(),
    body: v.optional(v.string()),
    href: v.optional(v.string()), // deep-link OS shell
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "readAt"]),

  announcements: defineTable({
    tenantId: v.id("tenants"),
    title: v.string(),
    bodyMd: v.string(),
    createdBy: v.id("users"),
    postedToDiscord: v.boolean(),
  }).index("by_tenant", ["tenantId"]),
});
