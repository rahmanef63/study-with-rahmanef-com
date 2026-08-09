// Shared shapes for the seed DATA modules. Types only — no Convex imports, so
// a data file never drags the server runtime in.
//
// Why these live apart from convex/seed.ts: that file was 984 LOC, ~5x the
// repo's 200-LOC ceiling, and almost all of it was Bahasa-Indonesia course
// copy rather than logic. Splitting DATA from the mutations means adding a
// course is an edit to one array, and the seeding rules stay readable.

export type SeedLesson = { title: string; contentMd: string; links?: { label: string; url: string }[] };
export type SeedQuiz = {
  title: string;
  passingScorePct: number;
  questions: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[];
};
export type SeedModule = { title: string; lessons: SeedLesson[]; quiz?: SeedQuiz };
export type SeedCourse = { slug: string; title: string; description: string; modules: SeedModule[] };

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
