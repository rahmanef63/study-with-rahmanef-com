// Table definitions — courses, lessons, progress, quiz. Composed in convex/schema.ts.
// SSOT doc: docs/DATA-MODEL.md. Deviations require updating that doc FIRST.
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const courses = defineTable({
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
  .searchIndex("search_title", { searchField: "title", filterFields: ["tenantId", "status"] });

// RETIRING (DECISIONS #37): a course is an ordered list of materi, not a tree.
// Production had 30 modules for 75 lessons — 2.5 lessons each, which carried
// almost no information. Kept declared until the backfill has flattened every
// one into `courseLessons` and the reads have moved over.
export const modules = defineTable({
  tenantId: v.id("tenants"),
  courseId: v.id("courses"),
  title: v.string(),
  order: v.number(),
}).index("by_course", ["courseId"]);

// MATERI. A lesson is a standalone piece of teaching that BELONGS TO A TENANT,
// not to a course: "sub agents" can sit in the Claude Code course and the
// Hermes course at once (DECISIONS #36). Placement lives in `courseLessons`.
//
// MIGRATION IN PROGRESS. `courseId`/`moduleId`/`order` are the legacy ownership
// tree, kept OPTIONAL while reads move over; `slug`/`status`/`authorId` are the
// new columns, also optional because Convex validates every existing row and 75
// of them predate the change. Step 3 drops the legacy three and tightens the
// new three. Until then:
//   - a row with no `status` is PUBLISHED (drafts were a course-level concept),
//   - a row with no `slug` has not been backfilled yet.
export const lessons = defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  /** Stable per-tenant handle — how one materi references another. */
  slug: v.optional(v.string()),
  status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  authorId: v.optional(v.id("users")),
  youtubeVideoId: v.optional(v.string()), // 11-char ID, never a full URL
  /** Canonical when `contentBlocks` is absent; DERIVED from it when present, so
   *  the two can never drift — one write path regenerates it (DECISIONS #38). */
  contentMd: v.string(),
  /** Notion-style block JSON. Canonical when present. */
  contentBlocks: v.optional(v.string()),
  links: v.array(v.object({ label: v.string(), url: v.string() })),
  // ── legacy ownership tree, retiring ────────────────────────────────────
  courseId: v.optional(v.id("courses")),
  moduleId: v.optional(v.id("modules")),
  order: v.optional(v.number()),
})
  .index("by_module", ["moduleId"])
  .index("by_course", ["courseId"])
  .index("by_tenant_slug", ["tenantId", "slug"])
  .index("by_tenant_status", ["tenantId", "status"])
  .index("by_author", ["authorId"])
  // fase-2 (#23): pencarian materi per tenant (filter tenantId; draft-guard di query)
  .searchIndex("search_content", { searchField: "contentMd", filterFields: ["tenantId"] });

/** Placement: which materi a course teaches, in what order. The join that makes
 *  one materi reusable across courses. `by_lesson` is the backlink — "muncul di
 *  kelas: Claude Code, Hermes". */
export const courseLessons = defineTable({
  tenantId: v.id("tenants"),
  courseId: v.id("courses"),
  lessonId: v.id("lessons"),
  order: v.number(),
})
  .index("by_course", ["courseId", "order"])
  .index("by_lesson", ["lessonId"])
  // Uniqueness probe: a materi may appear in a course at most once.
  .index("by_course_lesson", ["courseId", "lessonId"]);

/** Tags on a materi. A join table rather than an array column because Convex
 *  cannot index array membership, and browsing "semua materi bertag prompting"
 *  has to be an indexed read, not a scan. */
export const lessonTags = defineTable({
  tenantId: v.id("tenants"),
  /** Lowercased, trimmed. Display casing is not preserved on purpose. */
  tag: v.string(),
  lessonId: v.id("lessons"),
})
  .index("by_tenant_tag", ["tenantId", "tag"])
  .index("by_lesson", ["lessonId"])
  .index("by_tenant_tag_lesson", ["tenantId", "tag", "lessonId"]);

/** Materi → materi references, so a page can link to another page and the
 *  target can show its backlinks. Derived from the content on save. */
export const lessonRefs = defineTable({
  tenantId: v.id("tenants"),
  fromLessonId: v.id("lessons"),
  toLessonId: v.id("lessons"),
})
  .index("by_from", ["fromLessonId"])
  .index("by_to", ["toLessonId"])
  .index("by_from_to", ["fromLessonId", "toLessonId"]);

// Completion belongs to the MATERI, not to a (materi, course) pair. Once one
// lesson lives in several courses, keeping courseId as part of the identity
// would ask someone who finished "sub agents" in Claude Code to do it again in
// Hermes, and would double-count their progress. courseId is kept optional as
// provenance ("where they first finished it") and is no longer part of the key;
// course progress is derived as courseLessons ∩ completions.
export const lessonCompletions = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  courseId: v.optional(v.id("courses")),
  lessonId: v.id("lessons"),
})
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_course", ["courseId"])
  // v1.7 (#37): "Lanjutkan belajar" lintas perangkat — recents per user
  // terurut _creationTime di dalam index.
  .index("by_user", ["userId"]);

export const courseCompletions = defineTable({
  // = badge (PRD R11)
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  courseId: v.id("courses"),
})
  .index("by_user", ["userId"])
  .index("by_user_course", ["userId", "courseId"]);

export const quizzes = defineTable({
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
}).index("by_module", ["moduleId"]);

export const quizAttempts = defineTable({
  tenantId: v.id("tenants"),
  userId: v.id("users"),
  quizId: v.id("quizzes"),
  answers: v.array(v.number()),
  scorePct: v.number(),
  passed: v.boolean(),
})
  .index("by_user_quiz", ["userId", "quizId"])
  .index("by_quiz", ["quizId"]);
