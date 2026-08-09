// search slice — href builders (pure; unit-tested). URLs follow the community
// route scheme /k/<tenant>/kelas/<course>[/<lessonId>]. Kept in sync with
// lib/community.ts communityHref by hrefs.test.ts; the slice does not import
// the app layer (rr P1: slices stay host-agnostic).
import type { SearchHit } from "../types";

export function buildCourseHref(tenantSlug: string, courseSlug: string): string {
  return `/k/${encodeURIComponent(tenantSlug)}/kelas/${encodeURIComponent(courseSlug)}`;
}

export function buildLessonHref(
  tenantSlug: string,
  courseSlug: string,
  lessonId: string
): string {
  return `${buildCourseHref(tenantSlug, courseSlug)}/${encodeURIComponent(lessonId)}`;
}

/**
 * Diskusi post permalink. Mirrors convex/features/posts/notify.ts postHref —
 * the notification deep-link and the search deep-link must never drift.
 */
export function buildPostHref(tenantSlug: string, postId: string): string {
  return `/k/${encodeURIComponent(tenantSlug)}/post/${encodeURIComponent(postId)}`;
}

/**
 * Href for any hit — dispatches on the kind discriminator. Every kind is now an
 * INTERNAL route: the third source became the Diskusi feed (v1.8 #33), so the
 * external-url special case the curated resource board needed is gone.
 */
export function hitHref(tenantSlug: string, hit: SearchHit): string {
  if (hit.kind === "post") return buildPostHref(tenantSlug, hit.postId);
  return hit.kind === "course"
    ? buildCourseHref(tenantSlug, hit.courseSlug)
    : buildLessonHref(tenantSlug, hit.courseSlug, hit.lessonId);
}
