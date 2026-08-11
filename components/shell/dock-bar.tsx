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

/** 56px tall: the iOS tab-bar height, and comfortably over the 44px floor. */
export const DOCK_CELL_CLASS =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 pt-1 text-[0.625rem] leading-tight transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

/** The in-flow spacer the fixed bar owes the document. Rendered by DockBar. */
const SPACER = "h-[calc(3.5rem+var(--safe-b))] md:hidden";

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
              <cell.icon className="size-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate">{cell.label}</span>
            </Link>
          ))}
          {trailing}
        </div>
      </nav>
    </>
  );
}
