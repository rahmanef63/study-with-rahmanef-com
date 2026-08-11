"use client";

// The phone dock, as pure presentation. Two callers fill it: the community dock
// (four destinations plus a Menu cell that opens the rail) and the account dock
// (its whole nav fits, so no Menu cell).
//
// It exists so the app has ONE phone-navigation model. Before this, a community
// page docked its nav to the bottom edge while an account page hid the same
// kind of nav behind a hamburger in the top-left corner — two mental models for
// one job, and the worse of the two on the pages a thumb reaches least well.
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type DockCell = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

/**
 * A cell. 60px tall: a 36px icon box, 4px gap and an 11px label need more room
 * than the 56px iOS tab bar, and CareerPack budgets the same via --nav-height.
 *
 * Shape borrowed from ../CareerPack's BottomNav, which the owner asked for by
 * name: a fixed-size box holding the icon with the LABEL BELOW it, rather than
 * an icon and a caption sharing one flow. The box is what makes an active state
 * legible at a glance — CareerPack fills it with a tint, and a filled shape
 * survives sunlight, a cracked screen and colour-blindness in a way a
 * recoloured 20px glyph does not.
 */
export const DOCK_CELL_CLASS =
  "group flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 px-1 pt-1 text-[0.6875rem] font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

/** The icon box. Square, because --radius is 0 — CareerPack's rounded-xl is
 *  their language, the filled-box IDEA is what transfers. */
export const DOCK_ICON_BOX =
  "grid size-9 shrink-0 place-items-center border-2 transition-colors";

export const dockIconBox = (active: boolean) =>
  `${DOCK_ICON_BOX} ${
    active
      ? "border-primary bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--pixel-shadow)]"
      : "border-transparent"
  }`;

/** The in-flow spacer the fixed bar owes the document. Rendered by DockBar. */
const SPACER = "h-[calc(3.75rem+var(--safe-b))] md:hidden";

export function DockBar({
  cells,
  trailing,
  label,
}: {
  cells: readonly DockCell[];
  /** The Menu cell, when the caller has more destinations than fit. */
  trailing?: React.ReactNode;
  label: string;
}) {
  return (
    <>
      {/* An IN-FLOW spacer, not padding on <main>: the bar is fixed, so it owns
          the space it covers, and a shell rendered without a dock then gets no
          phantom gap. */}
      <div aria-hidden className={SPACER} />
      <nav
        aria-label={label}
        // z-30 matches the top bar: above content, below the sheet (50) and the
        // CRT overlay. Opaque, hard 2px rule, no floating pill — the same edge
        // language as everything else in the cabinet.
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 bg-card pb-[var(--safe-b)] pl-[var(--safe-l)] pr-[var(--safe-r)] md:hidden"
      >
        <div className="mx-auto flex w-full max-w-5xl items-stretch">
          {cells.map((cell) => (
            <Link
              key={cell.key}
              href={cell.href}
              aria-current={cell.active ? "page" : undefined}
              className={`${DOCK_CELL_CLASS} ${
                cell.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={dockIconBox(cell.active)}>
                <cell.icon className="size-5" aria-hidden />
              </span>
              <span className="max-w-full truncate">{cell.label}</span>
            </Link>
          ))}
          {trailing}
        </div>
      </nav>
    </>
  );
}
