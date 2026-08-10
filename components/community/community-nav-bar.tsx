// The phone navigation bar — a UINavigationBar with large titles, in CSS.
//
// TWO LAYERS, one of which sticks. This bar is `sticky top-0` and NEVER changes
// height; the large title lives BELOW it in normal flow and simply scrolls
// underneath (same `bg-card`, so the slide is invisible). That is how iOS gets
// a large title that collapses without the content below it ever jumping — a
// single element that shrinks on scroll would reflow the whole page twice per
// scroll session.
//
// It stays a SERVER component: the only dynamic part is one boolean,
// `<html data-nav-collapsed>`, set by <NavCollapseSentinel/> and read by the
// `.nav-rule` / `.nav-title-compact` utilities in app/globals.css.
import { Skeleton } from "@/components/ui/skeleton";

/** Content height, before --safe-t. 52 + the 2px rule = 54px, inside the 56 cap
 *  and leaving 4px of air around a 44px control instead of squeezing it. */
const BAR_H = "3.25rem";

export function CommunityNavBar({
  title,
  action,
}: {
  title: string;
  /** AT MOST ONE. Membership-aware, so it arrives as a client island. */
  action: React.ReactNode;
}) {
  return (
    <nav
      // Queried by NavCollapseSentinel to derive its rootMargin from the real
      // rendered height (which grows by the notch inset on a real device).
      data-community-navbar
      // z-30: under the bottom bar (40), the drawer (50) and the CRT overlay.
      // Opaque bg-card, no blur — the same material as the bottom bar, so the
      // two chrome edges of the app read as one frame.
      aria-label="Aksi komunitas"
      className="nav-rule sticky top-0 z-30 border-b-2 bg-card pt-[var(--safe-t)] md:hidden"
      // Inline, because only an inline style outranks the unlayered
      // `* { border-color }` in globals.css. See .nav-rule there.
      style={{ borderBottomColor: "var(--nav-rule-color)" }}
    >
      <div
        className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4"
        style={{ minHeight: BAR_H }}
      >
        {/* Duplicate of the <h1> below, so aria-hidden: a screen reader already
            heard the name. Reserves its space in both states, so the action
            never shifts sideways when the title fades in. */}
        <span
          aria-hidden
          className="nav-title-compact min-w-0 flex-1 truncate font-display text-[0.6875rem] uppercase tracking-wide"
        >
          {title}
        </span>
        <div className="shrink-0">{action}</div>
      </div>
    </nav>
  );
}

/** Same geometry as the real bar, so the suspended header never jumps. */
export function CommunityNavBarSkeleton() {
  return (
    // <nav> not <div>: this bar has to be a sibling of <header> (a sticky
    // element only sticks inside its own parent's box, and the header is ~100px
    // tall), which left the screen's ONLY primary action outside every landmark
    // — a screen-reader user navigating by landmark would skip it entirely.
    <nav
      aria-label="Aksi komunitas"
      className="sticky top-0 z-30 border-b-2 border-transparent bg-card pt-[var(--safe-t)] md:hidden"
    >
      <div
        className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4"
        style={{ minHeight: BAR_H }}
      >
        <div className="flex-1" />
        <Skeleton className="h-11 w-24" />
      </div>
    </nav>
  );
}
