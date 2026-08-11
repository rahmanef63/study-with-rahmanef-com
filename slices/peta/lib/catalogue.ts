// Resolve a PLAN against the LIVE catalogue.
//
// The engine's path catalogue is DATA compiled into the bundle: it names ten
// course slugs and thirteen materi slugs that were true when it was written. A
// course can be unpublished, renamed or moved at any time, and a plan that
// sends a stranger to a 404 on their first tap is worse than a plan with one
// fewer link. So every slug is checked against what the etalase says exists
// TODAY, and anything missing degrades — never breaks.
//
// Pure and synchronous: the fetching happens in app/mulai/catalogue.ts.
import type { CourseRef, KnowledgeGap, PetaResult, RankedPath } from "@/lib/peta";
import type { LiveCatalogue, LiveCommunity } from "../types";

const key = (communitySlug: string, slug: string) => `${communitySlug}/${slug}`;

/** Flattened lookups. Built once per render, cheap enough to skip memoising. */
export type CatalogueIndex = {
  /** `community/course` → LIVE title. */
  courseTitle: Map<string, string>;
  /** `community/materi` → true. */
  materi: Set<string>;
  community: Map<string, LiveCommunity>;
};

export function indexCatalogue(catalogue: LiveCatalogue): CatalogueIndex {
  const courseTitle = new Map<string, string>();
  const materi = new Set<string>();
  const community = new Map<string, LiveCommunity>();
  for (const c of catalogue.communities) {
    community.set(c.slug, c);
    for (const course of c.courses) courseTitle.set(key(c.slug, course.slug), course.title);
    for (const slug of c.materiSlugs) materi.add(key(c.slug, slug));
  }
  return { courseTitle, materi, community };
}

/** Courses that are published RIGHT NOW, retitled to whatever they are called
 *  now. Teaching order is preserved. */
function liveCourses(courses: readonly CourseRef[], index: CatalogueIndex): CourseRef[] {
  const out: CourseRef[] = [];
  for (const course of courses) {
    const title = index.courseTitle.get(key(course.communitySlug, course.courseSlug));
    if (title === undefined) continue;
    out.push({ ...course, title });
  }
  return out;
}

function liveGap(gap: KnowledgeGap, index: CatalogueIndex): KnowledgeGap {
  if (gap.materi === null) return gap;
  const live = index.materi.has(key(gap.materi.communitySlug, gap.materi.materiSlug));
  // Not-live reads exactly like never-taught: "belum ada materinya". Honest in
  // both cases, and the UI needs only one branch.
  return live ? gap : { ...gap, materi: null };
}

/**
 * The plan, with every dead link removed.
 *
 * A path whose courses have ALL gone is dropped — its weekly steps still make
 * sense, but "here is a route through the platform" is a lie when the platform
 * no longer has the route. The drop is skipped when it would empty the screen:
 * a plan with an unlinked path beats no plan at all, and `paths` is documented
 * as never empty.
 */
export function resolveAgainstCatalogue(
  result: PetaResult,
  catalogue: LiveCatalogue
): PetaResult {
  const index = indexCatalogue(catalogue);
  const paths: RankedPath[] = result.paths.map((path) => ({
    ...path,
    courses: liveCourses(path.courses, index),
  }));
  const withCourses = paths.filter((path) => path.courses.length > 0);
  return {
    ...result,
    paths: withCourses.length > 0 ? withCourses : paths,
    gaps: result.gaps.map((gap) => liveGap(gap, index)),
  };
}

/** The community row a path belongs to, or null when the catalogue never
 *  loaded it (Convex down, or the community was suspended). */
export function communityFor(
  catalogue: LiveCatalogue,
  communitySlug: string
): LiveCommunity | null {
  return catalogue.communities.find((c) => c.slug === communitySlug) ?? null;
}
