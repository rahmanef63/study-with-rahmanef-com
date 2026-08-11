"use client";

// The below-md compact bar for the account surfaces, and the slide-over that
// holds the same rail. Deliberately the same geometry, the same z-index, the
// same left-edge Sheet and the same 44px trigger as
// components/shell/shell-top-bar.tsx — the app must not change shape when you
// step out of a community into your account.
//
// It is a separate FILE for the reason AccountNav is: <ShellTopBar/> requires a
// tenantId (it mounts <ShellAction/>, the membership-aware control) and there is
// no tenant here. What is duplicated is 20 lines of Sheet wiring, not a nav —
// the rows inside the panel are the sibling's components, once.
//
// SHEET, NOT DRAWER — same reasoning as the community bar, restated because the
// next person will read this file alone: a NAVIGATION drawer belongs on the
// LEFT edge, where the persistent rail lives at md and up, and vaul's physics
// are tuned for the bottom-anchored, drag-to-dismiss idiom over content that
// does not scroll. Radix Dialog gives the focus trap, Escape, restore-focus and
// scroll lock for free.
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCloseAboveMd } from "@/components/shell";
import { AccountNav } from "./account-nav";

/** Matches BAR_H in components/shell/shell-top-bar.tsx. 52 + the 2px rule. */
const BAR_H = "3.25rem";

/**
 * Where you are, for the phone bar. Derived from the pathname rather than
 * passed down, because the whole point of app/(akun)/layout.tsx is that ONE
 * instance of this bar survives every hop inside the group — a prop from the
 * layout would be frozen at whichever route mounted it.
 *
 * One entry per segment of app/(akun). If you add a folder there, add it here;
 * the fallback is the app name, never a blank bar.
 */
const TITLES: Record<string, string> = {
  "/komunitas": "Komunitas",
  "/notifikasi": "Notifikasi",
  "/pengaturan": "Pengaturan",
};

export function AccountTopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const title = TITLES[pathname] ?? "Belajar";

  // Closes on navigation, including a browser Back out of the sheet — which the
  // rows' own onClick handler alone would miss.
  useEffect(() => setOpen(false), [pathname]);
  // …and when the viewport grows past md, where the persistent rail takes over.
  useCloseAboveMd(open, close);

  return (
    <header className="sticky top-0 z-30 border-b-2 bg-card pt-[var(--safe-t)] md:hidden">
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
            // Without this Radix logs a missing-describedby warning on open.
            aria-describedby={undefined}
            className="w-[17.5rem] gap-0 border-r-2 bg-sidebar p-0 sm:max-w-[17.5rem]"
          >
            <SheetTitle className="sr-only">Navigasi</SheetTitle>
            <AccountNav
              onNavigate={close}
              className="pt-[calc(var(--safe-t)+0.75rem)] pl-[var(--safe-l)]"
            />
          </SheetContent>
        </Sheet>
        {/* Body face, never Press Start 2P: the display face is DISPLAY-ONLY.
            aria-hidden because the page's own visible <h1> says the same thing
            a few pixels below. */}
        <span aria-hidden className="min-w-0 flex-1 truncate text-sm font-medium">
          {title}
        </span>
      </div>
    </header>
  );
}
