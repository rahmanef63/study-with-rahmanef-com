// The admin destinations that already exist. Pantau watches the platform;
// Kelola changes it. Labels stay in lockstep with the sidebar, the phone
// switcher, and the breadcrumb section names.
import { communityHref } from "@/lib/community";

export type AdminLink = {
  label: string;
  href: string;
  /** Index route. A prefix match would light it on every admin page. */
  exact?: boolean;
};

export const ADMIN_NAV_GROUPS: { label: "Pantau" | "Kelola"; links: AdminLink[] }[] = [
  {
    label: "Pantau",
    links: [
      { label: "Ringkasan", href: communityHref.admin(), exact: true },
      { label: "Statistik belajar", href: communityHref.adminAnalytics() },
      { label: "Pengunjung", href: communityHref.adminTraffic() },
      { label: "Pengguna", href: communityHref.adminUsers() },
    ],
  },
  {
    label: "Kelola",
    links: [
      { label: "Komunitas", href: communityHref.adminCommunities() },
      { label: "MCP admin", href: communityHref.adminMcp() },
    ],
  },
];

export function isAdminLinkActive(pathname: string, link: AdminLink): boolean {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}
