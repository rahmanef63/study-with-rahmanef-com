// Community (tenant) nav vocabulary — WHICH sections a community offers, in
// what order, and which of them may disappear when the tenant has nothing
// behind them. Split out of ./community.ts (which stayed the URL vocabulary)
// purely for the 200-LOC ceiling; ./community.ts re-exports every name here,
// so `@/lib/community` remains the single import path for consumers.
//
// "Tab" is a HISTORICAL name kept for churn's sake, not a description: the
// desktop tab strip and the phone bottom bar were both deleted on 2026-08-11
// and these rows are now the DASHBOARD RAIL's list. Renaming CommunityTab /
// COMMUNITY_TABS / TenantTabSignal would touch the shell, two test files and a
// slice barrel test to say the same thing, so the type stayed and the comments
// were fixed instead.
import { communityHref } from "./community-href";

const enc = encodeURIComponent;


export type CommunityTab = {
  key: string;
  label: string;
  href: (slug: string) => string;
  /** Exact match only — Kelas IS the index route, so a prefix match would
   *  light it up on every child page. */
  exact?: boolean;
  /** Extra path prefixes that should also light this row. A post permalink
   *  lives at /k/<slug>/post/<id>, a SIBLING of /diskusi rather than a child,
   *  so without this the rail goes blank-active and the reader loses their
   *  place in the IA. */
  alsoMatch?: ((slug: string) => string)[];
  /**
   * Hide this row when the tenant has nothing behind it. The value names a
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
 * rail needs anyway for its "N anggota · M kelas" line, as three `.take(1)`
 * index probes. Zero extra round trips; hiding a row costs three index seeks on
 * a query that was already in flight.
 *
 * PUBLISHED-ONLY, because that is all an anonymous reader can be told. A
 * community whose only skills are drafts sees no Skills row; its author writes
 * them in Kelola › Skills, which the rail surfaces to instructor+ and never
 * hides.
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
 * THE NAV CATALOGUE — every section a member can walk to, in the order the
 * DASHBOARD RAIL lists them (components/shell/shell-nav.tsx, rendered as the
 * persistent md+ sidebar and as the phone slide-over). Only sections whose
 * route EXISTS may be listed: an unbuilt row does not 404, it falls through to
 * whatever catch-all is left and renders a dead end, which is worse. "Kelola"
 * is absent on purpose — instructor+ only, resolved in the browser
 * (components/shell/shell-action.tsx), never a learner row.
 *
 * ORDER, RE-DERIVED 2026-08-11 for a LIST. The previous order was a BUDGET: the
 * phone bar took the first four keys and left the rest in a "Lainnya" sheet, so
 * the list was sorted by how often a member RETURNS and Kelas — the index route
 * — was pushed to third by two doors that get opened more. There is no budget
 * any more. Nothing is hidden behind a fifth cell, so frequency has stopped
 * being the question and ADJACENCY is the whole of it: eight rows read top to
 * bottom, and what they must do is group.
 *
 *   1 Kelas      — it IS /k/<slug>. The row you are standing on when you arrive
 *                  must be the first row, or the rail opens with its cursor
 *                  parked in the middle of a list you did not choose from. This
 *                  is the ONE change of substance from the strip's order, and
 *                  it costs the reading doors nothing: Kelas is a reading door
 *                  too — the guided arrangement of the same materi.
 *   2 Materi     — the library. Tenant-level content with its own canonical
 *   3 Skills       URLs; a course is one arrangement of it. Skills is literally
 *                  the same table (`kind: "skill"`), so it sits next to Materi.
 *                  Rows 1–3 are LEARN.
 *   4 Diskusi    — TALK. The one write surface, and the only row a member can
 *                  make non-empty themselves.
 *   5 Anggota    — PEOPLE. Who is here, and (Peringkat) who is carrying the
 *   6 Peringkat    room. Peringkat is a projection of the roster, so it can
 *                  only follow it.
 *   7 Kalender   — WHEN. Hidden on every community today (no events).
 *   8 Tentang    — WHAT THIS IS. Read once, before joining; last on purpose,
 *                  and the only row a returning member never needs.
 *
 * Return frequency has NOT been thrown away — it still orders rows 2–3 against
 * 4–6, and the seeded numbers still back it (25 lesson completions across 4
 * people: reading is what members do here, a 12-row roster is scrolled once).
 * It simply stopped being allowed to break the group boundaries, because in a
 * rail a broken group is visible and in a five-cell bar it was not.
 *
 * WHICH ROWS MAY VANISH, and why the rest may not. A row that is always empty
 * teaches people that navigation is decoration, so the three whose emptiness is
 * REAL and CHEAPLY KNOWABLE carry `needs`. The other five stay listed:
 *  · Kelas — see above; hiding it would drop the route you are standing on out
 *    of its own nav. A community with no published course still has a home.
 *  · Diskusi — a WRITE surface. Empty means "be the first to post"; hiding it
 *    removes the only way to make it non-empty. Emptiness is the CTA.
 *  · Anggota — a tenant always has an owner, so it is never empty.
 *  · Peringkat — never empty either (the roster with zero scores is the honest
 *    answer). "Nobody has completed anything yet" would be the interesting
 *    signal and there is no cheap anonymous count for it, so we keep the row
 *    rather than guess.
 *  · Tentang — renders the tenant profile the rail already proves exists.
 */
export const COMMUNITY_TABS: CommunityTab[] = [
  { key: "kelas", label: "Kelas", href: communityHref.home, exact: true },
  { key: "materi", label: "Materi", href: communityHref.materi, needs: "hasMateri" },
  { key: "skills", label: "Skills", href: communityHref.skills, needs: "hasSkills" },
  { key: "diskusi", label: "Diskusi", href: communityHref.diskusi, alsoMatch: [(slug) => `/k/${enc(slug)}/post/`] },
  { key: "anggota", label: "Anggota", href: communityHref.anggota },
  // Member-only board (listTop is requireTenantRole(member)); the route itself
  // renders GabungDulu to a stranger rather than 404ing, so it is safe to list.
  { key: "peringkat", label: "Peringkat", href: communityHref.peringkat },
  // Public row: publicListUpcoming/publicListPast are on the anonymous etalase
  // whitelist, so this renders real HTML for a crawler; only the join link is
  // gated. Every community has 0 events today — hence `needs`.
  { key: "kalender", label: "Kalender", href: communityHref.kalender, needs: "hasEvents" },
  { key: "tentang", label: "Tentang", href: communityHref.tentang },
];

/** The rows this tenant should actually be offered, in COMMUNITY_TABS order. */
export function visibleCommunityTabs(
  signal: TenantTabSignal = TAB_SIGNAL_UNKNOWN
): CommunityTab[] {
  return COMMUNITY_TABS.filter((tab) => tab.needs === undefined || signal[tab.needs]);
}

/**
 * The four destinations that earn a cell in the phone dock, best first.
 *
 * The dock was removed with the tab strip on 2026-08-11 and the owner asked for
 * it back the same week — correctly. A rail behind a hamburger is fine on a
 * desktop where it is always visible; on a phone it turns every navigation into
 * two taps and puts the trigger in the top-left corner, the furthest point from
 * a thumb. The rail still exists as the slide-over; the dock is the shortcut to
 * the four places people actually go.
 *
 * SEPARATE from COMMUNITY_TABS order on purpose, and this is the one thing that
 * could drift, so the reason is written here: the rail is a MAP and reads
 * best in a stable, structural order (Kelas first, because a course is the
 * unit a community is organised around). The dock is a SHORTCUT and ranks by
 * traffic — materi is the thing people open, and the owner's whole last three
 * waves were about making it so. `dockTabs` filters this against the same tab
 * signal, so a hidden destination can never take a cell.
 */
const DOCK_PRIORITY = ["materi", "kelas", "diskusi", "skills", "anggota", "peringkat", "tentang"];

/** Cells before the Menu one. Internal: `dockTabs` is the API. */
const DOCK_CELLS = 4;

export function dockTabs(signal?: TenantTabSignal): CommunityTab[] {
  const visible = visibleCommunityTabs(signal);
  const rank = (tab: CommunityTab) => {
    const i = DOCK_PRIORITY.indexOf(tab.key);
    return i === -1 ? DOCK_PRIORITY.length : i;
  };
  return [...visible].sort((a, b) => rank(a) - rank(b)).slice(0, DOCK_CELLS);
}
