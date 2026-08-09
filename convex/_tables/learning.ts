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

export const modules = defineTable({
  tenantId: v.id("tenants"),
  courseId: v.id("courses"),
  title: v.string(),
  order: v.number(),
}).index("by_course", ["courseId"]);

export const lessons = defineTable({
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
  .searchIndex("search_content", { searchField: "contentMd", filterFields: ["tenantId"] });

export const lessonCompletions = defineTable({
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
