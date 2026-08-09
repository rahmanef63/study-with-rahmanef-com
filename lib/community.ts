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
  quiz: (slug: string, courseSlug: string, moduleId: string) =>
    `/k/${enc(slug)}/kelas/${enc(courseSlug)}/kuis/${enc(moduleId)}`,
  diskusi: (slug: string) => `/k/${enc(slug)}/diskusi`,
  /** Post permalink — the shareable, indexable unit of the Diskusi feed. */
  post: (slug: string, postId: string) => `/k/${enc(slug)}/post/${enc(postId)}`,
  anggota: (slug: string) => `/k/${enc(slug)}/anggota`,
  peringkat: (slug: string) => `/k/${enc(slug)}/peringkat`,
  kalender: (slug: string) => `/k/${enc(slug)}/kalender`,
  tentang: (slug: string) => `/k/${enc(slug)}/tentang`,
  cari: (slug: string) => `/k/${enc(slug)}/cari`,
  kelola: (slug: string) => `/k/${enc(slug)}/kelola`,
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
 */
export const COMMUNITY_TABS: CommunityTab[] = [
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
