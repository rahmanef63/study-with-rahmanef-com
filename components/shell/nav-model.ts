// What the dashboard rail is allowed to contain — as DATA, with no JSX and no
// hooks, so the whole nav can be unit-tested without a renderer.
//
// The community section is NOT listed here. It comes from
// `visibleCommunityTabs(signal)` in lib/community at render time, which is what
// keeps data-driven hiding alive: a community with no published skill has no
// Skills row, in the rail and in the phone sheet, from the same SSOT the old
// tab strip used. Re-declaring those rows here would freeze them into a static
// list and quietly regress that. All this file adds is the ICON per tab key and
// the two sections the tab SSOT does not own (community tools, account).
import { Bell, BookOpen, CalendarDays, Circle, Compass, Home,
  Info, Library, LayoutGrid,
  Map, MessagesSquare, ScrollText, Search, Settings, SlidersHorizontal, Trophy, UserRound, Users, Wand2, type LucideIcon } from "lucide-react";
import { communityHref } from "@/lib/community";

/** One rail row. `icon` is a component, so this module is client-only — it is
 *  imported by the client nav, never handed across the server boundary. */
export type ShellLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Light only on an exact pathname match (an index route). */
  exact?: boolean;
};

// Keyed by CommunityTab.key. Kept out of lib/community-tabs.ts on purpose: a
// lucide component is a function, that module is imported by the SERVER layout,
// and a function cannot cross the server→client boundary (it has broken this
// app three times). Same split the retired bottom bar used.
const TAB_ICONS: Record<string, LucideIcon> = {
  materi: Library,
  // A wand, not a "Sparkles/Brain" AI glyph: a skill is a prompt you WIELD.
  skills: Wand2,
  kelas: BookOpen,
  diskusi: MessagesSquare,
  anggota: Users,
  peringkat: Trophy,
  kalender: CalendarDays,
  tentang: Info,
};

/** Icon for a community tab. `Circle` is a visible placeholder, never a crash —
 *  and nav-model.test.ts fails if any shipped tab key reaches it. */
export const iconFor = (key: string): LucideIcon => TAB_ICONS[key] ?? Circle;

/** Every key TAB_ICONS answers for. Exported for the test, not for rendering. */
export const ICON_KEYS = Object.keys(TAB_ICONS);

/**
 * Community routes that are NOT tabs. Cari is a real destination inside the
 * community (`/k/<slug>/cari`) that COMMUNITY_TABS deliberately never listed —
 * it used to hang off the desktop brand row and off the phone "Lainnya" sheet,
 * i.e. it was reachable by two different accidents. In a rail it is simply a
 * row. There is NO global /cari: that path 404s.
 */
export function communityToolLinks(slug: string): ShellLink[] {
  return [{ key: "cari", label: "Cari", href: communityHref.cari(slug), icon: Search }];
}

/**
 * Global destinations, in EVERY rail.
 *
 * These lived inside `communityToolLinks` and were therefore unreachable from
 * the account pages — a reader on /pengaturan could not get to the roadmap or
 * the assessment at all. They are not community-scoped and never were; the
 * only reason they sat there is that a community rail was the only rail that
 * listed anything.
 */
/** The dock's four cells when there is no community — same budget as inside
 *  one, so the bar never changes shape as you move around the app. */
export const GLOBAL_DOCK_LINKS: ShellLink[] = [
  { key: "komunitas", label: "Komunitas", href: "/komunitas", icon: Compass, exact: true },
  { key: "roadmap", label: "Roadmap", href: "/roadmap", icon: Map, exact: true },
  { key: "peta", label: "Peta belajar", href: "/mulai", icon: Compass, exact: true },
  { key: "notifikasi", label: "Notifikasi", href: "/notifikasi", icon: Bell, exact: true },
];

/**
 * The home screen. The PATH is `/home` and the LABEL is Bahasa, which is a
 * deliberate mismatch: `next.config.mjs` carries a `permanent: true` redirect
 * from `/beranda` to `/`, left over from an earlier route migration. A 308 is
 * cached by browsers indefinitely, so anyone who ever opened the old `/beranda`
 * would keep being bounced to the landing page no matter what this repo does
 * next — removing the redirect cannot un-cache it. `/home` has no such history.
 * The path is not user-facing; the label is.
 */
export const HOME_LINK: ShellLink = {
  key: "home",
  label: "Beranda",
  href: "/home",
  icon: Home,
  exact: true,
};

/**
 * NO LONGER IN THE RAIL. These three sat in a "Jelajah" group under the
 * community's own tabs, where they were permanent chrome for three
 * destinations a reader visits deliberately, not constantly. They are now the
 * CARDS on /beranda — same three links, same order, one tap away via the
 * Beranda button, and with room for a sentence explaining each.
 *
 * Kept exported because /beranda renders from this list: the rail and the home
 * screen cannot drift into naming the same destination two different ways.
 */
export const EXPLORE_LINKS: ShellLink[] = [
  // ALWAYS THREE, community or not. "Komunitas" used to exist only as a
  // "‹ Komunitas lain" back-link in the header, which meant the directory was
  // reachable from the rail on the account pages and NOT from inside a
  // community — the one place you would look for it. The header now carries a
  // switcher instead, and this group is the static half of the nav: it does not
  // change shape when the dynamic half above it does.
  { key: "komunitas", label: "Komunitas", href: "/komunitas", icon: LayoutGrid, exact: true },
  { key: "roadmap", label: "Roadmap", href: "/roadmap", icon: Map, exact: true },
  { key: "peta", label: "Peta belajar", href: "/mulai", icon: Compass, exact: true },
];

/** Instructor+ only — resolved in the browser, see shell-action.tsx. */
export function kelolaLink(slug: string): ShellLink {
  return {
    key: "kelola",
    label: "Kelola",
    href: communityHref.kelola(slug),
    icon: SlidersHorizontal,
  };
}

/**
 * The account section, for a signed-in reader. Two of these three had NO entry
 * point anywhere inside /k before this rail existed: /notifikasi and
 * /pengaturan were reachable only by typing the URL (the notification bell and
 * the settings link both died with the OS shell). That is the other half of
 * what a dashboard sidebar buys.
 */
export const ACCOUNT_LINKS: ShellLink[] = [
  { key: "notifikasi", label: "Notifikasi", href: "/notifikasi", icon: Bell, exact: true },
  { key: "pengaturan", label: "Pengaturan", href: "/pengaturan", icon: Settings, exact: true },
  { key: "changelog", label: "Changelog", href: "/changelog", icon: ScrollText, exact: true },
];

/** `/u/<username>` — only knowable in the browser (see shell-account-nav.tsx). */
export function profileLink(username: string): ShellLink {
  return {
    key: "profil",
    label: "Profil saya",
    href: communityHref.profile(username),
    icon: UserRound,
  };
}

/**
 * Active state for a row that is NOT a community tab.
 *
 * Community tabs go through `isCommunityTabActive` instead — it already encodes
 * `exact` (Kelas IS the index route) and `alsoMatch` (a post permalink is a
 * SIBLING of /diskusi, not a child), and a second matcher that drifts from it
 * is a navigation bug you only notice on one breakpoint.
 *
 * The `/` in the prefix branch is load-bearing: a bare startsWith would light
 * `/notifikasi` on a hypothetical `/notifikasi-lama`.
 */
export function isPathActive(href: string, pathname: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
