"use client";

// The phone dock. Four destinations plus the menu, fixed to the bottom edge.
//
// WHY IT CAME BACK. The sidebar wave replaced the tab strip AND the bottom bar
// with one slide-over, and the owner asked for the dock back within the week.
// They were right: on a phone the rail is behind a hamburger in the top-LEFT
// corner — the single furthest point from a thumb on a 390px screen — so every
// navigation became reach, tap, read a list, tap. The rail is still the map;
// this is the shortcut to the four places people actually go.
//
// THE MENU TRIGGER LIVES HERE, NOT IN THE TOP BAR. One trigger, in the thumb
// zone. Two triggers for one panel would be two things to keep in sync and two
// places to look; the top bar keeps the community name and the one action.
// SHEET, NOT DRAWER. Both are vendored (components/ui/sheet.tsx wraps Radix
// Dialog, components/ui/drawer.tsx wraps vaul) and the choice is not taste:
//   · This is a NAVIGATION drawer, so it must come from the LEFT edge — the
//     same place the persistent rail lives at md and up. One nav, one position,
//     at every width. vaul is built around the bottom-anchored idiom; its
//     left direction exists but its drag physics and background-scaling are
//     tuned for the sheet-from-below gesture.
//   · The panel SCROLLS (eight destinations plus the account block). vaul
//     resolves a vertical drag as dismiss-vs-scroll; a nav list should never
//     have to arbitrate that.
//   · Radix Dialog gives the focus trap, Escape, `aria-modal`, restore-focus
//     and scroll lock for free. The vaul Drawer stays where it belongs — the
//     retired "Lainnya" sheet was a six-row action list from the bottom edge,
//     which is exactly what vaul is for.
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isCommunityTabActive } from "@/components/community/tab-active";
import { dockTabs, type TenantTabSignal } from "@/lib/community";
import { DockBar, DOCK_CELL_CLASS, dockIconBox } from "./dock-bar";
import { iconFor } from "./nav-model";
import { ShellNav } from "./shell-nav";
import { useCloseAboveMd } from "./use-close-above-md";

export function ShellDock({
  slug,
  name,
  tenantId,
  memberLabel,
  signal,
}: {
  slug: string;
  name: string;
  tenantId: Id<"tenants">;
  memberLabel?: string | null;
  signal?: TenantTabSignal;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Closes on navigation — including a browser Back out of the panel, which an
  // onClick on the rows alone would miss.
  useEffect(() => setOpen(false), [pathname]);
  // …and when the viewport grows past md, where the persistent rail takes over.
  // Without this, rotating a 390x844 phone to landscape (844px wide) left the
  // panel open OVER the rail with the scroll lock still held.
  useCloseAboveMd(open, close);

  const cells = dockTabs(signal).map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: tab.href(slug),
    icon: iconFor(tab.key),
    active: isCommunityTabActive(tab, slug, pathname),
  }));

  return (
    <DockBar
      label="Navigasi cepat"
      cells={cells}
      trailing={
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Buka navigasi lengkap"
            // BLUR FIRST — lifted from ../CareerPack's BottomNav, which
            // documents the reason: the trigger keeps focus while Radix marks
            // the bar behind the sheet `aria-hidden`, and the browser then
            // refuses with a "descendant retained focus" warning. Radix moves
            // focus into the panel and restores it on close either way, so
            // dropping it here costs nothing.
            onClick={(e) => e.currentTarget.blur()}
            className={`${DOCK_CELL_CLASS} text-muted-foreground hover:text-foreground`}
          >
            <span className={dockIconBox(false)}>
              <Menu className="size-5" aria-hidden />
            </span>
            <span>Menu</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            aria-describedby={undefined}
            className="w-[17.5rem] gap-0 border-r-2 bg-sidebar p-0 sm:max-w-[17.5rem]"
          >
            <SheetTitle className="sr-only">Navigasi</SheetTitle>
            <ShellNav
              slug={slug}
              name={name}
              tenantId={tenantId}
              memberLabel={memberLabel}
              signal={signal}
              onNavigate={close}
              className="pt-[calc(var(--safe-t)+0.75rem)] pl-[var(--safe-l)]"
            />
          </SheetContent>
        </Sheet>
      }
    />
  );
}
