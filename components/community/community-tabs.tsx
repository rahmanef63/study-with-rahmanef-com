"use client";

// The tab strip. This ~50-line component is what replaced 21,000 lines of
// window manager: a row of links with an active underline, scrollable
// horizontally on a phone. No dock, no menu bar, no springboard.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMUNITY_TABS } from "@/lib/community";
import { cn } from "@/lib/utils";

export function CommunityTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Bagian komunitas" className="-mb-px overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-1">
        {COMMUNITY_TABS.map((tab) => {
          const href = tab.href(slug);
          const active = tab.exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={tab.key}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors",
                  active
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
