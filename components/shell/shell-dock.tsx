"use client";

// Phone dock. Four destinations plus Menu, fixed to the bottom edge.
//
// Menu opens a bottom sheet. The desktop sidebar stays in the md+ aside and
// stays hidden below md — this panel must not slide that rail in from the
// left. The sheet reuses ShellNav, including the install row, so the
// destinations stay one list. Radix Dialog, not vaul: the list scrolls, and a
// vertical drag-to-dismiss would fight that scroll.
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isCommunityTabActive } from "@/components/community/tab-active";
import { dockTabs } from "@/lib/community";
import { DockBar, DOCK_CELL_CLASS, dockIconBox } from "./dock-bar";
import { GLOBAL_DOCK_LINKS, iconFor, isPathActive } from "./nav-model";
import { ShellNav, type ShellCommunity } from "./shell-nav";
import { useCloseAboveMd } from "./use-close-above-md";

export function ShellDock({ community }: { community?: ShellCommunity }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Closes on navigation — including a browser Back out of the panel, which an
  // onClick on the rows alone would miss.
  useEffect(() => setOpen(false), [pathname]);
  // …and when the viewport grows past md, where the persistent rail takes over.
  useCloseAboveMd(open, close);

  const cells =
    community === undefined
      ? GLOBAL_DOCK_LINKS.map((link) => ({
          key: link.key,
          label: link.label,
          href: link.href,
          icon: link.icon,
          active: isPathActive(link.href, pathname, link.exact),
        }))
      : dockTabs(community.signal).map((tab) => ({
          key: tab.key,
          label: tab.label,
          href: tab.href(community.slug),
          icon: iconFor(tab.key),
          active: isCommunityTabActive(tab, community.slug, pathname),
        }));

  return (
    <DockBar
      label="Navigasi cepat"
      cells={cells}
      trailing={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Buka navigasi lengkap"
            // Drop focus before Radix hides the bar, or the browser warns that
            // a focused descendant sits inside aria-hidden.
            onClick={(e) => e.currentTarget.blur()}
            className={`${DOCK_CELL_CLASS} text-muted-foreground hover:text-foreground`}
          >
            <span className={dockIconBox(false)}>
              <Menu className="size-5" aria-hidden />
            </span>
            <span>Menu</span>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            className="max-h-[min(85dvh,40rem)] gap-0 overflow-hidden bg-background p-0"
          >
            <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 bg-border" />
            <SheetTitle className="px-5 pt-3 text-base">Menu</SheetTitle>
            <ShellNav community={community} onNavigate={close} className="min-h-0" />
          </SheetContent>
        </Sheet>
      }
    />
  );
}
