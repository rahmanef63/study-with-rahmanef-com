"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { communityHref } from "@/lib/community";
import { cn } from "@/lib/utils";

const tabs = [[communityHref.admin(), "Ringkasan"], [communityHref.adminAnalytics(), "Statistik belajar"], [communityHref.adminTraffic(), "Pengunjung"], [communityHref.adminCommunities(), "Komunitas"], [communityHref.adminMcp(), "MCP admin"]] as const;
export function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Admin platform" className="flex flex-wrap gap-x-2 border-b">{tabs.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={cn("inline-flex min-h-11 items-center border-b-2 px-3 text-sm transition-colors hover:text-foreground", pathname === href ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground")}>{label}</Link>)}</nav>;
}
