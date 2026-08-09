// search feature — explicit safe projections (P0: queries return an explicit
// shape, never raw docs). Hit shapes per docs/AGENT-PROMPTS.md #23 + #29:
//   { kind: "course" | "lesson", title, courseSlug, lessonId?, snippet? }
//   { kind: "post", title, postId, postKind }
// No ids beyond lessonId/postId (needed for the deep-link), no tenantId, no raw
// contentMd (snippet is stripped + truncated), no status/createdBy leak.
//
// TODO(rr): slices/search mirrors this union client-side (types.ts, lib/hrefs.ts,
// components/search-results.tsx, config/copy.ts groupResources). The third hit
// kind changed from "resource"{title,url} to "post"{title,postId,postKind} —
// that slice needs the matching update; it is not this feature's to edit.
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
 * Diskusi post matched by title (v1.8 #33 — this source replaced the curated
 * resource board, which no longer exists). Caller has ALREADY dropped
 * soft-deleted rows. Deep-link: /k/<tenantSlug>/post/<postId> — the click stays
 * INSIDE the community even for a "sumber" post; its external `linkUrl` is
 * shown on the post itself, and deliberately not projected here (a search
 * result that silently navigates off-site is the behaviour #33 dropped).
 * Shape is EXACT {kind, title, postId, postKind}: no bodyMd, no authorId,
 * no linkUrl, no counters.
 */
export function toPostHit(post: Doc<"posts">) {
  return {
    kind: "post" as const,
    title: post.title,
    postId: post._id,
    /** diskusi | pengumuman | usulan | sumber — the UI badges the group. */
    postKind: post.kind,
  };
}

export type CourseHit = ReturnType<typeof toCourseHit>;
export type LessonHit = ReturnType<typeof toLessonHit>;
export type PostHit = ReturnType<typeof toPostHit>;
export type SearchHit = CourseHit | LessonHit | PostHit;

/** searchInTenant result — flat, courses first; the client groups by kind. */
export type SearchInTenantResult = SearchHit[];
