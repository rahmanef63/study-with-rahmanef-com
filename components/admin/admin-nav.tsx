"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { communityHref } from "@/lib/community";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Pantau",
    tabs: [
      [communityHref.admin(), "Ringkasan"],
      [communityHref.adminAnalytics(), "Statistik belajar"],
      [communityHref.adminTraffic(), "Pengunjung"],
      [communityHref.adminUsers(), "Pengguna"],
    ],
  },
  {
    label: "Kelola",
    tabs: [
      [communityHref.adminCommunities(), "Komunitas"],
      [communityHref.adminMcp(), "MCP admin"],
    ],
  },
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === communityHref.admin()) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin platform" className="grid gap-4 border-b pb-4 sm:grid-cols-2">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.label}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {group.tabs.map(([href, label]) => {
              const active = isCurrent(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center border px-3 text-sm",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
