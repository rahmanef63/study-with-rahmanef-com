// Community (tenant) route vocabulary — the ONE place the /k/<slug> URL shape
// is written down. Every link in the app builds its href from here, so the
// prefix can change in one edit instead of a repo-wide grep.
//
// Import it as `@/lib/community` — this module and ./community-tabs.ts are
// halves of that barrel, split only to stay under the 200-LOC ceiling.

/** Flagship community `/` lands on. Env-overridable per deployment. */
export const DEFAULT_COMMUNITY_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_COMMUNITY_SLUG ?? "belajar-ai";

const enc = encodeURIComponent;

export const communityHref = {
  /** Kelas — the default tab. */
  home: (slug: string) => `/k/${enc(slug)}`,
  course: (slug: string, courseSlug: string) => `/k/${enc(slug)}/kelas/${enc(courseSlug)}`,
  lesson: (slug: string, courseSlug: string, lessonId: string) =>
    `/k/${enc(slug)}/kelas/${enc(courseSlug)}/${enc(lessonId)}`,
  /** A quiz belongs to a COURSE and is addressed by its own id (DECISIONS
   *  #37); a course may hold several. */
  quiz: (slug: string, courseSlug: string, quizId: string) =>
    `/k/${enc(slug)}/kelas/${enc(courseSlug)}/kuis/${enc(quizId)}`,
  /**
   * Materi — the tenant's whole library of teaching material (DECISIONS
   * #36/#37). A materi is owned by the COMMUNITY, not by a course, so it is
   * addressed here and not under /kelas.
   */
  materi: (slug: string) => `/k/${enc(slug)}/materi`,
  /**
   * THE canonical materi permalink — shareable, indexable, and stable no
   * matter which courses happen to teach it. `communityHref.lesson` above is
   * the SAME materi read inside a course (it keeps the prev/next path); when a
   * link has no course context — a search hit, a notification, a "muncul di"
   * row — it must point HERE.
   */
  materiPage: (slug: string, lessonSlug: string) =>
    `/k/${enc(slug)}/materi/${enc(lessonSlug)}`,
  /**
   * Skills — the prompt library. A skill is a MATERI with `kind: "skill"` and
   * its own `promptText`, not a new table, so it inherits tags, search,
   * permalinks, backlinks, OG cards and the block editor. It gets its own
   * route anyway because it is a different READING JOB: you come to /materi to
   * learn something and to /skills to grab a prompt and leave.
   */
  skills: (slug: string) => `/k/${enc(slug)}/skills`,
  /**
   * THE canonical skill permalink. Sibling of `materiPage`, and the two share
   * ONE slug namespace (both are rows of `lessons`) — so either route can be
   * handed the other kind's slug by someone who copied the wrong path. Both
   * pages resolve the row's real `kind` and REDIRECT here rather than 404ing;
   * see app/k/[slug]/skills/[lessonSlug]/page.tsx.
   */
  skillPage: (slug: string, lessonSlug: string) =>
    `/k/${enc(slug)}/skills/${enc(lessonSlug)}`,
  diskusi: (slug: string) => `/k/${enc(slug)}/diskusi`,
  /**
   * Diskusi opened on ONE category. `?kind=` is a real deep link, not a
   * fragment: the feed's category filter is component state, so there is no
   * #anchor to scroll to — the page reads this param and starts the filter
   * there. Used by the Silabus "Sumber belajar" card and by the retired
   * /resources + /pengumuman redirects in next.config.mjs.
   */
  diskusiKind: (slug: string, kind: string) =>
    `/k/${enc(slug)}/diskusi?kind=${enc(kind)}`,
  /** Post permalink — the shareable, indexable unit of the Diskusi feed. */
  post: (slug: string, postId: string) => `/k/${enc(slug)}/post/${enc(postId)}`,
  anggota: (slug: string) => `/k/${enc(slug)}/anggota`,
  peringkat: (slug: string) => `/k/${enc(slug)}/peringkat`,
  kalender: (slug: string) => `/k/${enc(slug)}/kalender`,
  tentang: (slug: string) => `/k/${enc(slug)}/tentang`,
  cari: (slug: string) => `/k/${enc(slug)}/cari`,
  kelola: (slug: string) => `/k/${enc(slug)}/kelola`,
  /**
   * The BLOCK EDITOR for one materi row, of either kind — instructor+.
   * Addressed by id, not by slug: the editor is the one surface that must keep
   * working while the title (and therefore the slug) is being changed, and a
   * draft row has no readable permalink yet.
   */
  kelolaMateri: (slug: string, lessonId: string) =>
    `/k/${enc(slug)}/kelola/materi/${enc(lessonId)}`,
  /** Public profile. Not under /k — a person is not scoped to a community. */
  profile: (username: string) => `/u/${enc(username)}`,
} as const;
