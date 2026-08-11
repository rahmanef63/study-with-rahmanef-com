// Community (tenant) tab vocabulary — WHICH sections a community offers, in
// what order, and which of them may disappear when the tenant has nothing
// behind them. Split out of ./community.ts (which stayed the URL vocabulary)
// purely for the 200-LOC ceiling; ./community.ts re-exports every name here,
// so `@/lib/community` remains the single import path for consumers.
import { communityHref } from "./community-href";

const enc = encodeURIComponent;


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
  /**
   * Hide this tab when the tenant has nothing behind it. The value names a
   * field of `TenantTabSignal`; ABSENT means "always show" and every absence
   * below is argued, not defaulted. Hiding is NAVIGATION ONLY — the route, the
   * sitemap and every existing deep link keep working.
   */
  needs?: keyof TenantTabSignal;
};

/**
 * Does this tenant have anything behind its optional tabs?
 *
 * WHERE THE COUNTS COME FROM, AND WHY THERE IS NO EXTRA QUERY. The community
 * layout is a server component and permanently anonymous, so it can only read
 * whitelisted etalase queries — and it ALREADY reads two of them per request
 * (`getPublicBySlug` + `getPublicStatsBySlug`, both wrapped in `cache()`).
 * These three booleans are computed inside `getPublicStatsBySlug`, which the
 * header needs anyway for its "N anggota · M kelas" line, as three `.take(1)`
 * index probes. Zero extra round trips; the tab strip costs three index seeks
 * on a query that was already in flight.
 *
 * PUBLISHED-ONLY, because that is all an anonymous reader can be told. A
 * community whose only skills are drafts sees no Skills tab; its author writes
 * them in Kelola › Skills, which is linked from the header and never hidden.
 */
export type TenantTabSignal = {
  /** ≥1 published (or pre-`status`) materi row. */
  hasMateri: boolean;
  /** ≥1 published `kind: "skill"` row. */
  hasSkills: boolean;
  /** ≥1 event that is not canceled. */
  hasEvents: boolean;
};

/**
 * FAIL OPEN. Used when the signal is unavailable — Convex down (`safeQuery`
 * returns null), or a caller that has not plumbed it through yet. A failed read
 * must never make a route disappear from the navigation; over-showing costs one
 * empty page, under-showing hides content that exists.
 */
export const TAB_SIGNAL_UNKNOWN: TenantTabSignal = {
  hasMateri: true,
  hasSkills: true,
  hasEvents: true,
};

/**
 * The learner-facing tab strip. Only tabs whose route EXISTS may be listed: an
 * unbuilt tab does not 404, it falls through to whatever catch-all is left and
 * renders a dead end, which is worse. "Kelola" is absent on purpose —
 * instructor+ only, surfaced as a header link, never a learner tab.
 *
 * ORDER (materi model DECISIONS #36/#37; Skills added 2026-08-10) — sorted by
 * how often a member RETURNS, not by how much content sits behind each tab.
 * Materi leads: a materi is tenant-level content with its own canonical URL and
 * a course is one arrangement of it, so the library is the widest door in.
 * Skills second — a prompt you come back for weekly and leave in under a
 * minute — and beside Materi, which is what it literally is (same table).
 * Kelas third: the index route and the guided path a newcomer is sold on.
 * Diskusi fourth, then the social loop, then the two read-rarely pages.
 * `slices/materi/__tests__/barrel.test.ts` pins the first four keys.
 *
 * WHICH TABS MAY VANISH, and why the rest may not. A tab that is always empty
 * teaches people that tabs are decoration, so the three whose emptiness is
 * REAL and CHEAPLY KNOWABLE carry `needs`. The other five stay listed:
 *  · Kelas — it IS `/k/<slug>`. Hiding it would drop the route you are
 *    standing on out of its own strip. A community with no published course
 *    still has a home page.
 *  · Diskusi — a WRITE surface. Empty means "be the first to post"; hiding it
 *    removes the only way to make it non-empty. Emptiness is the CTA.
 *  · Anggota — a tenant always has an owner, so it is never empty.
 *  · Peringkat — never empty either (the roster with zero scores is the honest
 *    answer). "Nobody has completed anything yet" would be the interesting
 *    signal and there is no cheap anonymous count for it, so we keep the tab
 *    rather than guess.
 *  · Tentang — renders the tenant profile the header already proves exists.
 */
export const COMMUNITY_TABS: CommunityTab[] = [
  { key: "materi", label: "Materi", href: communityHref.materi, needs: "hasMateri" },
  { key: "skills", label: "Skills", href: communityHref.skills, needs: "hasSkills" },
  { key: "kelas", label: "Kelas", href: communityHref.home, exact: true },
  { key: "diskusi", label: "Diskusi", href: communityHref.diskusi, alsoMatch: [(slug) => `/k/${enc(slug)}/post/`] },
  { key: "anggota", label: "Anggota", href: communityHref.anggota },
  // Member-only board (listTop is requireTenantRole(member)); the route itself
  // renders GabungDulu to a stranger rather than 404ing, so it is safe to list.
  { key: "peringkat", label: "Peringkat", href: communityHref.peringkat },
  // Public tab: publicListUpcoming/publicListPast are on the anonymous etalase
  // whitelist, so this renders real HTML for a crawler; only the join link is
  // gated. Every community has 0 events today — hence `needs`.
  { key: "kalender", label: "Kalender", href: communityHref.kalender, needs: "hasEvents" },
  { key: "tentang", label: "Tentang", href: communityHref.tentang },
];

/** The tabs this tenant should actually be offered, in COMMUNITY_TABS order. */
export function visibleCommunityTabs(
  signal: TenantTabSignal = TAB_SIGNAL_UNKNOWN
): CommunityTab[] {
  return COMMUNITY_TABS.filter((tab) => tab.needs === undefined || signal[tab.needs]);
}

/** Cells in the phone bar before "Lainnya". Five total is the iOS ceiling. */
export const PHONE_BAR_SLOTS = 4;

/**
 * THE FIVE CELLS, re-derived 2026-08-11. Split the VISIBLE tabs — not all eight
 * — so hiding an empty tab PROMOTES a real one instead of merely shortening the
 * "Lainnya" sheet. That single change is the whole answer to the review note
 * about Anggota, and it answers it per-community rather than by decree:
 *
 *   belajar-ai   (14 skills, 0 events) → Materi · Skills · Kelas · Diskusi · ⋯
 *   karier-digital / kreator-konten
 *                (0 skills,  0 events) → Materi · Kelas · Diskusi · Anggota · ⋯
 *
 * So Anggota is back in the bar on both communities where nothing outranks it,
 * and stays one tap deep on the flagship where something does. The original
 * complaint was fair when it was made — Anggota lost its slot to a library that
 * shipped EMPTY. With 14 seeded skills the demotion is now earned, and if the
 * skills library were ever emptied the roster would take the slot back with no
 * code change.
 *
 * The ranking itself is the COMMUNITY_TABS order above (return frequency), and
 * it survives contact with the real numbers: 25 lesson completions across 4
 * people means reading is what members do, so both reading doors and the course
 * index outrank a 12-row roster you scroll once. Peringkat, Kalender and
 * Tentang were never candidates.
 */
export function phoneBarTabs(signal?: TenantTabSignal): {
  primary: CommunityTab[];
  overflow: CommunityTab[];
} {
  const visible = visibleCommunityTabs(signal);
  return {
    primary: visible.slice(0, PHONE_BAR_SLOTS),
    overflow: visible.slice(PHONE_BAR_SLOTS),
  };
}
