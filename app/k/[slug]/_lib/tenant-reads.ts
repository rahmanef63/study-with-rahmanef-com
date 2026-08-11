import { cache } from "react";
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import type { TenantTabSignal } from "@/lib/community";

// The community shell's anonymous reads, in ONE place so they are memoised ONCE
// per request. `generateMetadata`, the nav bar, the title block and both tab
// renderings all want the same two rows, and `fetchQuery` has no per-request
// dedupe of its own — without `cache()` every page under /k would pay four
// identical Convex round trips before it rendered.
//
// Split out of ../layout.tsx only to keep that file under the 200-LOC ceiling.
// `cache()` keys on the function identity, so these must stay module-level
// singletons: never wrap them again at a call site.
//
// Both queries are on the ANONYMOUS ETALASE WHITELIST (AGENTS.md §6), which is
// the only kind a server component here may call, and `safeQuery` never throws
// — a Convex outage degrades the shell instead of 500-ing a shareable page.

export const getTenant = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicBySlug, { slug })
);

export const getStats = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicStatsBySlug, { slug })
);

/**
 * WHICH TABS THIS COMMUNITY GETS, for free.
 *
 * `getStats` is already awaited on every page under /k/<slug> for the header's
 * "N anggota · M kelas" line, so reading the three tab booleans off it adds no
 * query and no round trip — it is the same response, three fields wider. That
 * is the whole reason the signal was put inside `getPublicStatsBySlug` instead
 * of a query of its own: a layout read is paid on EVERY navigation, so a second
 * one would have been the expensive way to remove an empty tab.
 *
 * `undefined` on a null read (unknown slug, or Convex down and `safeQuery`
 * swallowing it) → `visibleCommunityTabs` falls back to showing everything. A
 * failed read must never make a route vanish from the navigation.
 *
 * Returns PLAIN BOOLEANS, which is all that may cross into the two client navs.
 * Never the tab list itself: its `href` entries are functions, and a function
 * cannot cross the server→client boundary.
 */
export async function getTabSignal(slug: string): Promise<TenantTabSignal | undefined> {
  const stats = await getStats(slug);
  if (stats === null) return undefined;
  // `?? true` is NOT redundant, whatever the types say. The three fields are new
  // (2026-08-11) and this bundle can meet a Convex deployment that predates
  // them — during the deploy window, or on a rollback of one half only. Missing
  // then reads as `undefined`, and without this it would be FALSY: the Materi
  // and Skills tabs would vanish from a community that has both. Fail open.
  return {
    hasMateri: stats.hasMateri ?? true,
    hasSkills: stats.hasSkills ?? true,
    hasEvents: stats.hasEvents ?? true,
  };
}
