"use client";

// The rows. Split from sidebar.tsx only to stay under the 200-LOC ceiling in
// docs/rr-conventions.md — shadcn documents SidebarMenu as its own section for
// the same reason, that a menu row carries more rules than a region wrapper.
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("space-y-0.5", className)} {...props} />;
}

export function SidebarMenuItem(props: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" {...props} />;
}

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
// like before this comment existed). box-shadow is not in that cascade.
//
// HEIGHT IS BREAKPOINT-SPLIT. 44px is the TOUCH floor this design system holds
// everywhere, and the only touch rendering of this row is the phone slide-over,
// which lives BELOW md; the persistent rail is pointer-driven, where 36px is
// comfortable and 44px is padding. Measured before the split: 591px of rows in
// a 559px scroller at 1024x760, signed OUT. Precedent: papan-skor.tsx.
const ROW =
  "pixel-press flex min-h-11 w-full items-center gap-3 px-3 text-sm transition-colors md:min-h-9";
const ROW_ACTIVE =
  "bg-primary/10 font-medium text-primary shadow-[inset_3px_0_0_0_var(--color-primary)]";
const ROW_IDLE = "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

export function SidebarMenuButton({
  href,
  label,
  icon: Icon,
  isActive = false,
  onNavigate,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  /** Closes the phone slide-over. Client→client, never a server prop. */
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      // aria-current is the ONLY active signal a screen reader gets; the colour
      // is for eyes only.
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(ROW, isActive ? ROW_ACTIVE : ROW_IDLE, className)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
