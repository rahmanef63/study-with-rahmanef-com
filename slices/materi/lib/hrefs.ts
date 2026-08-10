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

// ── SKILLS ───────────────────────────────────────────────────────────────────
// A skill IS a materi (`lessons.kind`), so these are the same two URLs one
// segment over. The separate route is a reading-job distinction, not a data
// one: /materi is where you go to learn, /skills is where you go to take a
// prompt and leave.

/** The skills library. */
export function buildSkillsHref(tenantSlug: string): string {
  return `/k/${enc(tenantSlug)}/skills`;
}

/** THE canonical skill permalink. */
export function buildSkillPageHref(tenantSlug: string, lessonSlug: string): string {
  return `${buildSkillsHref(tenantSlug)}/${enc(lessonSlug)}`;
}

/** The skills library opened on ONE tag — the `?tag=` deep link again. */
export function buildSkillTagHref(tenantSlug: string, tag: string): string {
  return `${buildSkillsHref(tenantSlug)}?tag=${enc(tag)}`;
}

/**
 * THE permalink for a row, chosen by the row's OWN kind.
 *
 * Materi and skills share ONE slug namespace — both are rows of `lessons` —
 * so /materi/<slug> and /skills/<slug> can each be handed the other kind's
 * slug by anyone who copied the wrong path out of a chat. Every surface that
 * knows a row's kind builds its link through this, and the two permalink pages
 * redirect a mismatch here instead of 404ing: a shared link must never dead-end
 * on a detail the reader could not have known.
 */
export function buildKindPageHref(
  tenantSlug: string,
  kind: "materi" | "skill",
  lessonSlug: string
): string {
  return kind === "skill"
    ? buildSkillPageHref(tenantSlug, lessonSlug)
    : buildMateriPageHref(tenantSlug, lessonSlug);
}

/** The library a row belongs to — same dispatch, one level up. */
export function buildKindLibraryHref(tenantSlug: string, kind: "materi" | "skill"): string {
  return kind === "skill" ? buildSkillsHref(tenantSlug) : buildMateriHref(tenantSlug);
}
