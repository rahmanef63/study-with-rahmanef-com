// materi slice — href builders (pure; unit-tested). URLs follow the community
// route scheme /k/<tenant>/materi[/<lessonSlug>]. Kept in sync with
// lib/community.ts `communityHref.materi` / `communityHref.materiPage` by
// __tests__/barrel.test.ts; the slice does not import the app layer (rr P1:
// slices stay host-agnostic), so the test is the seam that catches drift.
const enc = encodeURIComponent;

/** The library. */
export function buildMateriHref(tenantSlug: string): string {
  return `/k/${enc(tenantSlug)}/materi`;
}

/**
 * THE canonical materi permalink. Every context-free link to a materi — a
 * search hit, a notification, a "muncul di" row, a tag chip's target — points
 * here, never at /kelas/<course>/<lessonId> (that URL is the same materi read
 * INSIDE a course, and it dies whenever the placement moves).
 */
export function buildMateriPageHref(tenantSlug: string, lessonSlug: string): string {
  return `${buildMateriHref(tenantSlug)}/${enc(lessonSlug)}`;
}

/**
 * The library opened on ONE tag. `?tag=` is a real deep link, not a fragment:
 * the chip filter is component state, so there is no anchor to scroll to — the
 * page reads the param and starts the filter there (same pattern as the
 * Diskusi feed's `?kind=`).
 */
export function buildMateriTagHref(tenantSlug: string, tag: string): string {
  return `${buildMateriHref(tenantSlug)}?tag=${enc(tag)}`;
}

/** A course overview. Duplicated from the search slice for the same reason it
 *  is duplicated there — a slice may not import the app layer. */
export function buildCourseHref(tenantSlug: string, courseSlug: string): string {
  return `/k/${enc(tenantSlug)}/kelas/${enc(courseSlug)}`;
}
