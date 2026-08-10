// Community (tenant) route vocabulary — the ONE place the /k/<slug> URL shape
// is written down. Every link in the app builds its href from here, so the
// prefix can change in one edit instead of a repo-wide grep.
//
// The backend stays fully multi-tenant; the UI is single-community-FIRST: `/`
// redirects to DEFAULT_COMMUNITY_SLUG and the directory is demoted to
// /komunitas, so a learner normally never sees a community picker.

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

export type CommunityTab = {
  key: string;
  label: string;
  href: (slug: string) => string;
  /** Exact match only — the Kelas tab is the index route, so a prefix match
   *  would light it up on every child page. */
  exact?: boolean;
  /** Extra path prefixes that should also light this tab. A post permalink
   *  lives at /k/<slug>/post/<id>, a SIBLING of /diskusi rather than a child,
   *  so without this the strip goes blank-active and the reader loses their
   *  place in the IA. */
  alsoMatch?: ((slug: string) => string)[];
};

/**
 * The learner-facing tab strip. Only tabs whose route EXISTS may be listed: an
 * unbuilt tab does not 404, it falls through to whatever catch-all is left and
 * renders a dead end, which is worse.
 *
 * Not here on purpose:
 * - "Kelola" — instructor+ only, surfaced as a header link, never a learner tab.
 *
 * ORDER (materi model DECISIONS #36/#37; Skills added 2026-08-10). Materi
 * LEADS: teaching material is tenant-level content with its own canonical URL,
 * and a course is just one ordered arrangement of it. The library is therefore
 * the widest door into the product — every materi is reachable from it, while
 * /kelas only reaches the ones somebody placed in a course.
 *
 * SKILLS SITS SECOND, ahead of Kelas, and the ordering rule is unchanged — the
 * list is sorted by how often a member returns, not by how much content sits
 * behind each tab. A skill is a prompt you come back for WEEKLY and leave in
 * under a minute; a course is a commitment you finish once. Second also keeps
 * it beside Materi, which is what it literally is (same table, `kind:
 * "skill"`), so the two library doors read as a pair instead of Skills looking
 * like a third kind of course. It must NOT lead: the library ships empty and a
 * first tab with nothing in it is the worst possible first screen.
 *
 * Kelas third — still the index route (`/k/<slug>`) and still the guided path
 * a new learner is sold on; Diskusi fourth (the daily return reason); then the
 * social loop (Anggota, Peringkat), then the two read-rarely pages.
 *
 * EIGHT tabs is far more than a phone bar can hold. The desktop strip shows
 * all of them; components/community/community-bottom-nav.tsx keeps FIVE cells
 * — Materi · Skills · Kelas · Diskusi · Lainnya — by taking the first four
 * BY KEY off this list, so Anggota joined Peringkat, Kalender and Tentang in
 * the "Lainnya" sheet the moment Skills was inserted here. Reorder here and
 * the phone bar follows; there is no second list to keep in sync. (Anggota
 * losing its slot is the intended trade: the roster is a browse-once page,
 * while both libraries are why a member opens the app at all.)
 */
export const COMMUNITY_TABS: CommunityTab[] = [
  { key: "materi", label: "Materi", href: communityHref.materi },
  { key: "skills", label: "Skills", href: communityHref.skills },
  { key: "kelas", label: "Kelas", href: communityHref.home, exact: true },
  { key: "diskusi", label: "Diskusi", href: communityHref.diskusi, alsoMatch: [(slug) => `/k/${enc(slug)}/post/`] },
  { key: "anggota", label: "Anggota", href: communityHref.anggota },
  // Member-only board (listTop is requireTenantRole(member)); the route itself
  // renders GabungDulu to a stranger rather than 404ing, so it is safe to list.
  { key: "peringkat", label: "Peringkat", href: communityHref.peringkat },
  // Public tab: publicListUpcoming/publicListPast are on the anonymous etalase
  // whitelist, so this renders real HTML for a crawler; only the join link is gated.
  { key: "kalender", label: "Kalender", href: communityHref.kalender },
  { key: "tentang", label: "Tentang", href: communityHref.tentang },
];
