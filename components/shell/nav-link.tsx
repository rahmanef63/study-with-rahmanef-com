"use client";

// One row of the rail, and the little section it lives in. Both renderings of
// the nav — the persistent md+ rail and the phone slide-over — mount the SAME
// components, so a row can never look or behave differently at one breakpoint.
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// 44px floor (min-h-11), square corners. The active row is a lit coin slot:
// gold text, a gold wash, and a hard 3px gold cursor down its leading edge —
// three signals, because the one thing navigation must never be is ambiguous
// about where you are.
//
// THE CURSOR IS AN INSET box-shadow, NOT A BORDER, and that is not a style
// preference. app/globals.css carries an UNLAYERED `* { border-color:
// var(--color-border) }`, and an unlayered declaration beats anything Tailwind
// emits into @layer utilities no matter how specific — so `border-primary`
// silently renders grey and `border-transparent` silently renders a visible
// frame around every idle row (which is exactly what nine stacked rows looked
// like before this comment existed). Same trap `.nav-rule` documents in
// globals.css; box-shadow simply is not in that cascade.
// HEIGHT IS BREAKPOINT-SPLIT, and that is a fix for a measured bug rather than
// a taste call. 44px is the TOUCH target floor this design system holds
// everywhere — but the only touch rendering of this row is the phone
// slide-over, which lives BELOW md. The persistent rail at md and up is driven
// by a pointer, where 36px is comfortable and 44px is padding.
//
// What it cost: measured at 1024x760 on /k/belajar-ai, signed OUT, the rail
// already overflowed — 591px of rows into a 559px scroller. Signing in adds
// three account rows, so it overflows a 900px viewport too. The first thing
// scrolled out of reach is the account section, which is the part furthest from
// where the eye lands. At md:min-h-9 the same 13 rows lose 104px and fit.
//
// Precedent, same reasoning: papan-skor.tsx renders `min-h-11 @sm:min-h-9`.
const ROW =
  "pixel-press flex min-h-11 w-full items-center gap-3 px-3 text-sm transition-colors md:min-h-9";
const ROW_ACTIVE =
  "bg-primary/10 font-medium text-primary shadow-[inset_3px_0_0_0_var(--color-primary)]";
const ROW_IDLE = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

export function NavLink({
  href,
  label,
  icon: Icon,
  active = false,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  /** Closes the phone slide-over. Client→client, never a server prop. */
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      // aria-current is the ONLY active signal a screen reader gets; the colour
      // is for eyes only.
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE, className)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

/**
 * A labelled group of rows INSIDE the rail's single <nav>.
 *
 * It used to render a <nav aria-label> of its own, on the argument that a
 * keyboard user jumping by landmark should know which list they are in. The
 * cost was two and three landmarks stacked in one sidebar, which reads — and
 * was reported — as "2 sidebar menu". Grouping links inside ONE navigation is
 * what headings are for; landmarks are for telling navigation apart from main
 * and from search, and there is only one navigation here.
 *
 * The label survives as the group's accessible name via aria-labelledby, so
 * nothing is lost for a screen reader: the rows still announce which group
 * they belong to, they just no longer fragment the landmark map.
 *
 * TWO THINGS CHANGED HERE 2026-08-14, both measured on the rendered rail:
 *
 * 1. The caption was `text-muted-foreground/70`. Sampled off the painted
 *    pixels, its brightest stroke reached 4.13:1 against the sidebar — and at
 *    `--text-caption` (0.75rem) WCAG AA wants 4.5:1, so the only two labels in
 *    the rail failed it. The `/70` is gone; the token alone measures 7.29:1,
 *    and the caption still reads quieter than a row because it is smaller,
 *    uppercase and tracked out, which is where that hierarchy belongs.
 *
 * 2. A GROUP NOW DRAWS ITS OWN BOUNDARY. Before, the community's eight rows had
 *    no visible caption while Jelajah's two and Akun's one did — the largest
 *    group was the unlabelled one, so the eye read eight floating rows followed
 *    by two labelled stubs. A rule above each captioned group makes the
 *    boundary structural instead of typographic, and it makes the first group
 *    symmetric with the rest for free: the header block above it already ends
 *    in `border-b-2`. So every group is preceded by a rule, and the first one's
 *    heading is simply the community's name, one level up in the hierarchy.
 */
export function NavSection({
  label,
  heading,
  className,
  children,
}: {
  label: string;
  /** Visible caption. Omit and the label becomes an sr-only one. */
  heading?: string;
  /** Only the account group uses this, to pin itself to the rail's floor. */
  className?: string;
  children: React.ReactNode;
}) {
  const id = `nav-group-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    // 1px, not the system's usual 2px: this sits UNDER the header's `border-b-2`
    // in the hierarchy, and four 2px rules in a 256px rail is a ladder.
    <div role="group" aria-labelledby={id} className={cn("px-2", heading && "mt-2 border-t", className)}>
      <p
        id={id}
        className={
          heading
            ? "px-3 pt-3 pb-1 text-caption uppercase tracking-wider text-muted-foreground"
            : "sr-only"
        }
      >
        {heading ?? label}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
