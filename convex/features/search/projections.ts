// search feature — explicit safe projections (P0: queries return an explicit
// shape, never raw docs). Hit shapes per docs/AGENT-PROMPTS.md #23 + #29:
//   { kind: "course" | "lesson", title, courseSlug, lessonId?, snippet? }
//   { kind: "resource", title, url }
// No ids beyond lessonId (needed for the deep-link), no tenantId, no raw
// contentMd (snippet is stripped + truncated), no status/createdBy leak.
import type { Doc } from "../../_generated/dataModel";
import { makeSnippet } from "./snippet";

/** Published course matched by title. Deep-link: /kelas/<tenant>/<courseSlug>. */
export function toCourseHit(course: Doc<"courses">) {
  return {
    kind: "course" as const,
    title: course.title,
    courseSlug: course.slug,
  };
}

/**
 * Lesson matched by content — caller has ALREADY verified the owning course
 * is published (draft-guard in the query). Deep-link:
 * /kelas/<tenant>/<courseSlug>/lesson/<lessonId>.
 */
export function toLessonHit(lesson: Doc<"lessons">, course: Doc<"courses">) {
  return {
    kind: "lesson" as const,
    title: lesson.title,
    courseSlug: course.slug,
    lessonId: lesson._id,
    snippet: makeSnippet(lesson.contentMd),
  };
}

/**
 * Approved resource matched by title (#29) — caller reads via
 * by_tenant_status(eq tenantId, eq "approved") so pending/rejected rows never
 * reach this projection. Click-through is the EXTERNAL url (new tab in the
 * UI). Shape is EXACT {kind, title, url}: no note, no submittedBy, no _id.
 */
export function toResourceHit(resource: Doc<"resources">) {
  return {
    kind: "resource" as const,
    title: resource.title,
    url: resource.url,
  };
}

export type CourseHit = ReturnType<typeof toCourseHit>;
export type LessonHit = ReturnType<typeof toLessonHit>;
export type ResourceHit = ReturnType<typeof toResourceHit>;
export type SearchHit = CourseHit | LessonHit | ResourceHit;

/** searchInTenant result — flat, courses first; the client groups by kind. */
export type SearchInTenantResult = SearchHit[];
