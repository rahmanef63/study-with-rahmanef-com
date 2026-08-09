import type { CommunityTab } from "@/lib/community";

/**
 * Is this tab the one the current URL belongs to?
 *
 * Lives here rather than inside the top strip because there are now TWO
 * renderings of the same nav — the desktop strip and the phone bottom bar —
 * and an active-state rule that drifts between them is a navigation bug you
 * only notice on one breakpoint.
 */
export function isCommunityTabActive(
  tab: CommunityTab,
  slug: string,
  pathname: string
): boolean {
  const href = tab.href(slug);
  if (tab.exact) return pathname === href;
  return (
    pathname.startsWith(href) ||
    (tab.alsoMatch?.some((prefix) => pathname.startsWith(prefix(slug))) ?? false)
  );
}
