// search slice — deep-link href builders (pure; unit-tested). URLs follow the
// OS shell deep-link scheme (AGENTS.md §0/§9): windows open from these paths.
// The slice never imports os-shell — navigation goes through the onNavigate
// seam (or next/link fallback) with these hrefs.
import type { SearchHit } from "../types";

export function buildCourseHref(tenantSlug: string, courseSlug: string): string {
  return `/kelas/${tenantSlug}/${courseSlug}`;
}

export function buildLessonHref(
  tenantSlug: string,
  courseSlug: string,
  lessonId: string
): string {
  return `/kelas/${tenantSlug}/${courseSlug}/lesson/${lessonId}`;
}

/** Href for any hit — dispatches on the kind discriminator. */
export function hitHref(tenantSlug: string, hit: SearchHit): string {
  return hit.kind === "course"
    ? buildCourseHref(tenantSlug, hit.courseSlug)
    : buildLessonHref(tenantSlug, hit.courseSlug, hit.lessonId);
}
