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
const ROW =
  "pixel-press flex min-h-11 w-full items-center gap-3 px-3 text-sm transition-colors";
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
 * A labelled group of rows. The label is a real <nav aria-label>, not a visual
 * caption with nothing behind it: a keyboard user jumping by landmark lands on
 * "Bagian komunitas" or "Akun" and knows which list they are in.
 */
export function NavSection({
  label,
  heading,
  children,
}: {
  label: string;
  /** Visible caption. Omit for the primary list, which needs no title. */
  heading?: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={label} className="px-2">
      {heading ? (
        <p className="px-3 pt-3 pb-1 text-caption uppercase tracking-wider text-muted-foreground/70">
          {heading}
        </p>
      ) : null}
      <ul className="space-y-0.5">{children}</ul>
    </nav>
  );
}
