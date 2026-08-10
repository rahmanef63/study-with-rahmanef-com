// search feature — explicit safe projections (P0: queries return an explicit
// shape, never raw docs). Hit shapes per docs/AGENT-PROMPTS.md #23 + #29,
// retargeted for the materi model (DECISIONS #36/#37):
//   { kind: "course", title, courseSlug }
//   { kind: "lesson", title, lessonSlug, lessonId, snippet }
//   { kind: "post",   title, postId, postKind }
// No ids beyond lessonId/postId (needed for the deep-link), no tenantId, no raw
// contentMd (snippet is stripped + truncated), no status/createdBy leak.
//
// TODO(rr): slices/search mirrors this union client-side (types.ts,
// lib/hrefs.ts, components/search-results.tsx). The lesson hit lost
// `courseSlug` and gained `lessonSlug`: its href is now the CANONICAL materi
// URL /k/<tenant>/materi/<lessonSlug>, not a per-course path. That slice needs
// the matching update; it is not this feature's to edit.
import type { Doc } from "../../_generated/dataModel";
import { makeSnippet } from "./snippet";

/** Published course matched by title. Deep-link: /k/<tenant>/kelas/<courseSlug>. */
export function toCourseHit(course: Doc<"courses">) {
  return {
    kind: "course" as const,
    title: course.title,
    courseSlug: course.slug,
  };
}

/**
 * Materi matched by content — caller has ALREADY applied the materi
 * draft-guard (published, or instructor+ viewing a draft) and resolved the
 * slug. Deep-link: /k/<tenant>/materi/<lessonSlug>, the canonical shareable
 * page. A materi is tenant content, so a search hit no longer routes through
 * whichever course happens to teach it.
 */
export function toLessonHit(lesson: Doc<"lessons">, lessonSlug: string) {
  return {
    kind: "lesson" as const,
    title: lesson.title,
    lessonSlug,
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
