"use client";

// The tab strip. This ~50-line component is what replaced 21,000 lines of
// window manager: a row of links with an active underline.
//
// DESKTOP ONLY now (`md` and up). Below that the same nav renders as
// <CommunityBottomNav/> — six tabs in a scrolling strip fitted four on a Pixel 7
// with nothing to signal the other two existed, which on a phone means half the
// primary navigation was invisible.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { visibleCommunityTabs, type TenantTabSignal } from "@/lib/community";
import { cn } from "@/lib/utils";
import { isCommunityTabActive } from "./tab-active";

/**
 * `signal` is a PLAIN OBJECT of three booleans, computed by the server layout
 * and serialised across the boundary. The tab list itself is NOT passed down:
 * a CommunityTab carries `href: (slug) => string`, and a function cannot cross
 * server→client (it has broken this app three times). So the server sends the
 * data and this module calls `visibleCommunityTabs` itself — same import, same
 * SSOT, no function in the payload. Omitted → every tab shows (fail open).
 */
export function CommunityTabs({ slug, signal }: { slug: string; signal?: TenantTabSignal }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Bagian komunitas" className="-mb-px hidden overflow-x-auto md:block">
      <ul className="flex min-w-max gap-1 px-1">
        {visibleCommunityTabs(signal).map((tab) => {
          const active = isCommunityTabActive(tab, slug, pathname);
          return (
            <li key={tab.key}>
              <Link
                href={tab.href(slug)}
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
