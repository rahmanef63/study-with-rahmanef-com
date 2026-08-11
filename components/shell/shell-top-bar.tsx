"use client";

// Below md the rail cannot be persistent — 240px of a 390px screen is not a
// sidebar, it is the page. So the same nav becomes a slide-over behind a menu
// button, and what stays on screen is a 52px bar: trigger, where you are, one
// action.
//
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
import type { TenantTabSignal } from "@/lib/community";
import { ShellAction } from "./shell-action";
import { ShellNav } from "./shell-nav";
import { useCloseAboveMd } from "./use-close-above-md";

/** Content height, before --safe-t. 52 + the 2px rule = 54px: inside the 56px
 *  iOS cap, with 4px of air around a 44px control instead of squeezing it. */
const BAR_H = "3.25rem";

export function ShellTopBar({
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

  // Closes on navigation — including a browser Back out of the sheet, which an
  // onClick handler on the links alone would miss. Both are wired: the click
  // handler covers tapping the row you are already on (no pathname change).
  useEffect(() => setOpen(false), [pathname]);
  // …and when the viewport grows past md, where the persistent rail takes over.
  useCloseAboveMd(open, close);

  return (
    <header
      // z-30: above content, under the sheet (50) and the CRT overlay (9999).
      // Opaque bg-card and a hard 2px rule — no blur, no floating pill.
      className="sticky top-0 z-30 border-b-2 bg-card pt-[var(--safe-t)] md:hidden"
    >
      <div
        className="mx-auto flex w-full max-w-5xl items-center gap-2 pr-4 pl-2"
        style={{ minHeight: BAR_H }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Buka navigasi"
            className="pixel-press inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            // No description; without this Radix logs a missing-describedby
            // warning on every open.
            aria-describedby={undefined}
            className="w-[17.5rem] gap-0 border-r-2 bg-sidebar p-0 sm:max-w-[17.5rem]"
          >
            {/* Radix requires a title for the dialog's accessible name. The
                community name is already announced by the nav's own heading, so
                this one only has to say what the panel IS. */}
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
        {/* Body face, not Press Start 2P: the display face is DISPLAY-ONLY and
            at bar size it is unreadable and ~2x as wide — 24 characters of
            community name would not survive the 278px this slot gets on a
            390px screen. aria-hidden because the <h1> in the content column
            already gives a screen reader the same string. */}
        <span aria-hidden className="min-w-0 flex-1 truncate text-sm font-medium">
          {name}
        </span>
        <ShellAction tenantId={tenantId} slug={slug} variant="bar" />
      </div>
    </header>
  );
}

/** Same geometry as the real bar, so the suspended shell never jumps. */
export function ShellTopBarSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-30 border-b-2 bg-card pt-[var(--safe-t)] md:hidden"
      style={{ minHeight: BAR_H }}
    />
  );
}
