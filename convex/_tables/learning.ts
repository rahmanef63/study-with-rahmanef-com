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

// `modules` is GONE (DECISIONS #37, dropped 2026-08-10). A course is an ordered
// list of materi, not a tree. Production held 31 modules for 76 lessons — 2.5
// lessons each, carrying almost no information — and every one was flattened
// into `courseLessons` before `courses/legacyTreePurge` deleted them.

// MATERI. A lesson is a standalone piece of teaching that BELONGS TO A TENANT,
// not to a course: "sub agents" can sit in the Claude Code course and the
// Hermes course at once (DECISIONS #36). Placement lives in `courseLessons`.
//
// `slug` / `status` / `authorId` stay OPTIONAL even though the backfill filled
// all 76 rows. `status` in particular has a MEANINGFUL absence — a row without
// it reads as PUBLISHED, which is what kept pre-migration materi visible — so
// the visibility rule in features/courses/access.ts is the authority here, not
// the validator. Tightening them would move that decision into the schema,
// where the "missing means published" case cannot be expressed.
export const lessons = defineTable({
  tenantId: v.id("tenants"),
  title: v.string(),
  /** Stable per-tenant handle — how one materi references another. */
  slug: v.optional(v.string()),
  status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  /**
   * A SKILL is a materi, not a second table: `kind: "skill"` is the whole
   * difference. That is what buys the skills library tags, search, permalinks,
   * backlinks, OG cards, the sitemap and the block editor without writing any
   * of them twice.
   *
   * OPTIONAL, and `undefined` MEANS "materi" — the 76 production rows predate
   * this column exactly as they predate `status`. Every NEW skill writes
   * `kind: "skill"` explicitly, so the skills library is ONE exact index range
   * (`by_tenant_kind_status`) with no undefined case to chase; the materi
   * library keeps its existing range and excludes skills as it scans.
   */
  kind: v.optional(v.union(v.literal("materi"), v.literal("skill"))),
  /**
   * The prompt a skill hands the reader, verbatim and copy-able. Its own column
   * rather than a slice of the body because three surfaces need it whole and
   * unparsed: the copy panel, the library card preview and the skills-library
   * search. Explanation, examples and variations stay in `contentMd` below it.
   * Length cap + the reason for it live in `features/courses/lessons.ts`.
   */
  promptText: v.optional(v.string()),
  authorId: v.optional(v.id("users")),
  youtubeVideoId: v.optional(v.string()), // 11-char ID, never a full URL
  /** Canonical when `contentBlocks` is absent; DERIVED from it when present, so
   *  the two can never drift — one write path regenerates it (DECISIONS #38). */
  contentMd: v.string(),
  /** Notion-style block JSON. Canonical when present. */
  contentBlocks: v.optional(v.string()),
  links: v.array(v.object({ label: v.string(), url: v.string() })),
})
  .index("by_tenant_slug", ["tenantId", "slug"])
  .index("by_tenant_status", ["tenantId", "status"])
  // The skills library, as one exact range: eq(tenantId).eq(kind, "skill").
  // `status` rides along so the range stays useful when a skill is a draft.
  .index("by_tenant_kind_status", ["tenantId", "kind", "status"])
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
  // Completion identity is (userId, lessonId), so lessonId is the natural key
  // for "has ANYONE finished this materi". `courseId` is optional provenance —
  // it is left undefined for a materi taught by more than one course, which is
  // exactly the case this model exists for. A by_course probe therefore cannot
  // answer the question, and `deleteLesson`'s guard used to miss those rows.
  .index("by_lesson", ["lessonId"])
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

// A quiz hangs off the COURSE. `courseId` is the owner and has ALWAYS been
// required, so every existing row already resolves to a course — there is no
// backfill to run (DECISIONS #37).
export const quizzes = defineTable({
  tenantId: v.id("tenants"),
  courseId: v.id("courses"),
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
})
  .index("by_course", ["courseId"]);

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
