"use client";

import { usePathname } from "next/navigation";
import {
  Blocks,
  ChartNoAxesCombined,
  Globe,
  LayoutDashboard,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCurrentProfile } from "@/features/profiles";
import { SidebarGroup } from "@/components/shell/sidebar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/shell/sidebar-menu";
import { ADMIN_NAV_GROUPS, isAdminLinkActive, type AdminLink } from "./admin-destinations";

const ICONS: Record<string, LucideIcon> = {
  Ringkasan: LayoutDashboard,
  "Statistik belajar": ChartNoAxesCombined,
  Pengunjung: Globe,
  Pengguna: Users,
  Komunitas: LayoutGrid,
  "MCP admin": Blocks,
};

function GroupLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: AdminLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <SidebarMenuButton
            href={link.href}
            label={link.label}
            icon={ICONS[link.label] ?? LayoutDashboard}
            isActive={isAdminLinkActive(pathname, link)}
            onNavigate={onNavigate}
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

/** Pantau / Kelola inside the existing rail. Hidden unless this account is a
 *  platform admin — the chip row under the page header is already behind the
 *  access gate, and the rail must not advertise the console to everyone else. */
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile, isLoading } = useCurrentProfile();
  const onAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!onAdmin || isLoading || profile?.isPlatformAdmin !== true) return null;
  return (
    <>
      {ADMIN_NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.label} label={group.label} heading={group.label}>
          <GroupLinks links={group.links} pathname={pathname} onNavigate={onNavigate} />
        </SidebarGroup>
      ))}
    </>
  );
}
