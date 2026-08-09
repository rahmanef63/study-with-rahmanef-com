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
 * Href for any hit — dispatches on the kind discriminator. A resource hit's
 * href is its EXTERNAL url (#29): the item renders it target="_blank"
 * rel="noopener noreferrer" and never routes it through onNavigate/openApp.
 */
export function hitHref(tenantSlug: string, hit: SearchHit): string {
  if (hit.kind === "resource") return hit.url;
  return hit.kind === "course"
    ? buildCourseHref(tenantSlug, hit.courseSlug)
    : buildLessonHref(tenantSlug, hit.courseSlug, hit.lessonId);
}
