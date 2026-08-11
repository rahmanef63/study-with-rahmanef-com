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
import { usePathname } from "next/navigation";

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

// NO MENU TRIGGER HERE. It moved to <AccountDock/> on the bottom edge when the
// dock came back, so the app has one phone-navigation model and one reachable
// place to change screens. This bar is now just: where you are.
export function AccountTopBar() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Belajar";


  return (
    <header className="sticky top-0 z-30 border-b-2 bg-card pt-[var(--safe-t)] md:hidden">
      <div
        className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4"
        style={{ minHeight: BAR_H }}
      >
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
