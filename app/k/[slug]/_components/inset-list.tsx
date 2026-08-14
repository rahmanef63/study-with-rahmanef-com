// The iOS "inset grouped list" — the pattern behind Settings, Contacts and
// every roster Apple ships — wearing the arcade skin.
//
// Why it replaces a card-per-row: a framed row costs 2px of border, a 3px hard
// shadow and 8px of gap PER MEMBER. That is ~15px of chrome around ~40px of
// content, repeated N times, and it reads as a stack of boxes rather than as a
// list. One frame, N hairlines: same information, roughly a third of the
// pixels, and the eye gets a single edge to track down instead of N.
//
// INSET, not bled to the screen edge. A `-mx-5` full-bleed is what iOS's plain
// grouped style does, and it looked right — but the gutter it has to cancel
// lives on <main> in the community layout, which a sibling owns and changed
// from px-5 to px-4 mid-flight. The stale negative margin put 4px of horizontal
// scroll on every phone width. A layout that silently breaks when someone
// else's padding moves is not craft, it is a coincidence; the frame sits inside
// the gutter instead, which is Settings.app's geometry anyway and cannot
// overflow whatever the gutter becomes.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Row geometry, shared so every list in the community keeps one rhythm.
 *  min-h-14 is the iOS row (56px) — comfortably past the 44px target floor. */
export const INSET_ROW =
  "flex min-h-14 w-full items-center gap-3 px-3.5 py-2 text-left transition-colors md:px-4";

export function InsetList({
  as: As = "ul",
  /** Small caption above the group — iOS's grey section header. */
  caption,
  /** Explanatory note under the group — iOS's section footer. */
  footer,
  children,
  className,
}: {
  as?: "ul" | "ol";
  caption?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {caption ? (
        // Not `.eyebrow`: that utility hardcodes 0.75rem, which in Press Start
        // 2P reads as a heading and would out-shout the names underneath it.
        <p className="pb-1.5 font-display text-caption uppercase tracking-[0.14em] text-muted-foreground">
          {caption}
        </p>
      ) : null}
      <As className="divide-y divide-border rounded-[var(--radius)] border border-border bg-card shadow-sm">
        {children}
      </As>
      {footer ? (
        <p className="pt-2 text-pretty text-xs leading-relaxed text-muted-foreground">{footer}</p>
      ) : null}
    </div>
  );
}
