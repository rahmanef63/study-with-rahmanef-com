"use client";

// The rail, split into shadcn/ui's Sidebar parts.
//
// WHY THE COMPOSITION AND NOT `npx shadcn@latest add sidebar`.
// That package is ~700 LOC and brings a SidebarProvider (React context +
// cookie-persisted open state + a cmd/ctrl-B shortcut), a `collapsible="icon"`
// mode, a SidebarRail resize handle, a SidebarInset wrapper, per-row tooltips,
// and its OWN Sheet for the mobile drawer. This app needs none of it and one
// piece of it is actively harmful: `components/shell/shell-dock.tsx` already
// owns a Sheet holding this same nav, and standing a second slide-over beside
// it is literally the "kenapa ada 2 sidebar menu" that DECISIONS #26 was about.
// The width is fixed by a CSS grid in app-shell.tsx, so there is no state to
// provide and nothing to collapse.
//
// What was worth taking is the STRUCTURE, which is the part that was wrong
// here. shadcn splits the panel into three regions where only the middle one
// scrolls; this rail had all three inside one scroller, so a long community
// (every tab published, signed in) would scroll the account block out of reach
// — the exact failure the `md:min-h-9` pass papered over by making the rows
// short enough to fit today. Header and Footer are now siblings of Content, so
// no amount of rows can push them away.
//
// THE SEVEN PARTS, and the three deliberately absent:
//   Sidebar          → the <aside> in app-shell.tsx (grid column, fixed width)
//   SidebarHeader    → here. Sticky top: identity + the one action.
//   SidebarContent   → here. The ONLY scroller.
//   SidebarGroup     → here, with SidebarGroupLabel folded in as one prop.
//   SidebarMenu      → sidebar-menu.tsx. The <ul>.
//   SidebarMenuItem  → sidebar-menu.tsx. The <li>.
//   SidebarMenuButton→ sidebar-menu.tsx. The row.
//   SidebarFooter    → here. Sticky bottom: the account block.
//   ─ SidebarProvider: no collapse state to hold.
//   ─ SidebarRail:     the width is not resizable.
//   ─ SidebarInset:    app-shell.tsx uses a grid, not the inset variant.
//   ─ SidebarTrigger:  shell-dock.tsx owns it, and there is exactly one.
import { cn } from "@/lib/utils";

/** Identity and the primary action. Never scrolls. */
export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("shrink-0 space-y-2 border-b px-4 pb-4", className)}
      {...props}
    />
  );
}

/**
 * The scrolling middle.
 *
 * The rule between groups lives HERE, as a sibling selector, rather than on
 * SidebarGroup: expressed as "every group after the first", it cannot draw a
 * stray rule under the header (which already ends in `border-b`) and it
 * cannot double up with the footer's own. 1px, not the system's usual 2px —
 * this sits below the header's rule in the hierarchy, and four 2px lines in a
 * 256px rail is a ladder.
 */
export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain py-2",
        "[&>div+div]:mt-2 [&>div+div]:border-t",
        className
      )}
      {...props}
    />
  );
}

/**
 * The account block. A SIBLING of the content, not the last thing inside it.
 *
 * That is the whole point of adopting this split: a footer inside the scroller
 * is a footer that scrolls away, and the rows people reach for when they are
 * lost (profile, settings, sign out) are the ones that must never move.
 */
export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        "shrink-0 border-t pt-2 pb-[calc(var(--safe-b)+1rem)]",
        className
      )}
      {...props}
    />
  );
}

/**
 * A labelled group of rows INSIDE the rail's single <nav>.
 *
 * It used to render a <nav aria-label> of its own, on the argument that a
 * keyboard user jumping by landmark should know which list they are in. The
 * cost was two and three landmarks stacked in one sidebar, which reads — and
 * was reported — as "2 sidebar menu". Grouping links inside ONE navigation is
 * what headings are for; landmarks tell navigation apart from main and from
 * search, and there is only one navigation here. The label survives as the
 * group's accessible name via aria-labelledby, so a screen reader still hears
 * which group a row belongs to.
 *
 * `heading` is SidebarGroupLabel folded into a prop rather than a component:
 * shadcn needs a separate one because the label can host a CollapsibleTrigger,
 * and no group here collapses. Omit it and the label goes sr-only.
 *
 * Contrast note: the caption used to be `text-muted-foreground/70`, which
 * sampled 4.13:1 off the painted pixels — under AA's 4.5 for text this size.
 * The token alone measures 7.29:1, and the caption still reads quieter than a
 * row because it is smaller, uppercase and tracked out.
 */
export function SidebarGroup({
  label,
  heading,
  className,
  children,
}: {
  label: string;
  heading?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = `nav-group-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div role="group" aria-labelledby={id} className={cn("px-2", className)}>
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
      {children}
    </div>
  );
}
