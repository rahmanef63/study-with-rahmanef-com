// Shared shapes for the seed DATA modules. Types only — every import here is
// `import type`, so a data file never drags the server runtime in.
//
// Why these live apart from convex/seed.ts: that file was 984 LOC, ~5x the
// repo's 200-LOC ceiling, and almost all of it was Bahasa-Indonesia course
// copy rather than logic. Splitting DATA from the mutations means adding a
// course is an edit to one array, and the seeding rules stay readable.

/**
 * A course is a FLAT, ordered list of materi plus the quizzes that hang off the
 * COURSE — no module tree (DECISIONS #37). `SeedModule` is gone and the module
 * titles it carried were dropped on purpose: modules are not a product concept
 * any more, so re-introducing them as headings or as a `section` column would
 * smuggle back exactly what step 3 is removing.
 *
 * `lessons` order IS the teaching order: `upsertCurriculum` turns it into
 * `courseLessons.order` 1..n — the same flattened sequence the materi backfill
 * produced from the tree.
 *
 * ALIASED, not redeclared: `_seed/curriculum.ts` owns the shape AND the single
 * writer that all seeds (these data modules plus the standalone per-course
 * seeds) go through, so there is exactly one definition of "a seeded kelas".
 */
import type { SeedCurriculum } from "./curriculum";
export type { SeedMateri as SeedLesson, SeedCourseQuiz as SeedQuiz } from "./curriculum";
export type SeedCourse = SeedCurriculum;

export type SeedCommunity = {
  slug: string;
  name: string;
  description: string;
  track?: string;
  coverImageUrl?: string;
  courses: SeedCourse[];
  /** Pinned posts(kind "pengumuman") — the community's first Diskusi row. */
  welcome: { title: string; bodyMd: string };
  /** posts(kind "sumber") — curated links, no curation gate any more (#33). */
  sumber?: { title: string; url: string; note?: string }[];
};

export type SeedMember = { email: string; username: string; displayName: string; bio: string };
/** posts(kind "sumber"). No courseId: `posts` has no course column by design. */
export type SeedResource = { title: string; url: string; note?: string };
export type SeedThread = {
  courseSlug: string;
  root: { author: string; bodyMd: string };
  reply?: { author: string; bodyMd: string };
};
/** posts(kind "usulan" | "diskusi") + the members who liked it. */
export type SeedFeedPost = {
  title: string;
  bodyMd: string;
  author: string;
  likedBy: string[];
};
