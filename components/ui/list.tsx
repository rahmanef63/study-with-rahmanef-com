import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * INSET-GROUPED LIST — the iOS Settings list, in Arcade Cabinet clothing.
 *
 * The problem it exists to solve: every list in this app was a stack of
 * <Card>s, so N items drew N frames and N shadows and the screen read as a
 * spreadsheet of boxes. A grouped list draws ONE frame around N rows and
 * separates them with an inset hairline. Same information, a tenth of the ink.
 *
 * Shape on a phone: the group is FULL-BLEED — it escapes the page gutter and
 * touches both screen edges, with a rule only on top and bottom. From `sm` up it
 * pulls back into the gutter and becomes a framed group (all four sides + the
 * hard offset), exactly as iOS does moving from iPhone to iPad.
 *
 * Anatomy:
 *   <ListSection>
 *     <ListSectionHeader action={…}>Kelas kamu</ListSectionHeader>
 *     <List>
 *       <ListRow asChild>            ← renders <Link> / <button> / <div>
 *         <Link href="…">
 *           <ListRowMedia>…</ListRowMedia>
 *           <ListRowBody>
 *             <ListRowTitle>…</ListRowTitle>
 *             <ListRowMeta>…</ListRowMeta>
 *           </ListRowBody>
 *           <ListRowTrailing>…</ListRowTrailing>
 *           <ListRowChevron />
 *         </Link>
 *       </ListRow>
 *     </List>
 *     <ListFooter>Penjelasan singkat.</ListFooter>
 *   </ListSection>
 *
 * Separators are NOT rendered per row — `.list-group` (app/globals.css)
 * draws them with `> * + *::before`, so adding, removing or conditionally
 * rendering a row can never leave a dangling rule. Override the hairline's
 * left inset with `--list-inset` (default 1rem, i.e. flush with the row text).
 */

function ListSection({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="list-section" className={cn("space-y-2", className)} {...props} />
}

/**
 * The header sits OUTSIDE the group and inside the page gutter — that offset is
 * what makes the group below read as full-bleed rather than as a stray box.
 */
function ListSectionHeader({
  className,
  children,
  action,
  ...props
}: React.ComponentProps<"div"> & { action?: React.ReactNode }) {
  return (
    <div
      data-slot="list-section-header"
      className={cn("flex min-h-6 items-baseline justify-between gap-3", className)}
      {...props}
    >
      <h2 className="eyebrow truncate">{children}</h2>
      {action ? <div className="shrink-0 text-caption">{action}</div> : null}
    </div>
  )
}

/**
 * The group. Renders a <div> by default; pass `asChild` with a <ul> when the
 * rows are a semantic list (then the rows should be <li>).
 */
function List({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="list"
      className={cn(
        "list-group list-bleed bg-card text-card-foreground",
        // Phone: two rules, no side frame — the list belongs to the screen.
        "border-y-2",
        // Tablet+: a real group, framed like every other arcade surface.
        "sm:border-2 sm:shadow-[3px_3px_0_0_var(--pixel-shadow)]",
        className
      )}
      {...props}
    />
  )
}

/**
 * A row. 44px minimum target (Apple HIG), full-bleed padding, no frame of its
 * own — ever. `asChild` is the normal case: hand it a <Link> or a <button> and
 * it inherits the press states.
 */
function ListRow({
  className,
  asChild = false,
  interactive,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean; interactive?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  // asChild almost always means an anchor or a button, so default to the
  // interactive treatment unless a caller says otherwise.
  const isInteractive = interactive ?? asChild
  return (
    <Comp
      data-slot="list-row"
      className={cn(
        "flex w-full min-h-11 items-center gap-3 px-4 py-3 text-left",
        isInteractive &&
          // steps(): surfaces in a cabinet snap, they do not ease.
          "cursor-pointer transition-colors duration-75 [transition-timing-function:steps(2,end)] hover:bg-secondary/70 active:bg-secondary focus-visible:bg-secondary/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    />
  )
}

/** Leading slot — icon, avatar, index badge. Fixed width keeps titles aligned. */
const MEDIA = "flex size-7 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
function ListRowMedia({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="list-row-media" className={cn(MEDIA, className)} {...props} />
}

/** The text column. `min-w-0` is load-bearing: without it long titles blow out the row. */
function ListRowBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="list-row-body" className={cn("min-w-0 flex-1", className)} {...props} />
}

/** Body face, never Press Start 2P — the display face truncates card titles. */
function ListRowTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="list-row-title" className={cn("truncate text-title font-medium", className)} {...props} />
}

function ListRowMeta({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="list-row-meta" className={cn("truncate text-caption text-muted-foreground", className)} {...props} />
}

/** Trailing value — the greyed detail on the right of an iOS row. */
function ListRowTrailing({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="list-row-trailing" className={cn("ml-auto shrink-0 text-footnote text-muted-foreground", className)} {...props} />
}

/** The disclosure caret. Drawn in CSS, not an icon import. */
function ListRowChevron({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="list-row-chevron" aria-hidden className={cn("list-chevron shrink-0 text-muted-foreground", className)} {...props} />
}

/** Caption under a group. iOS puts the explanation here, not inside the rows. */
function ListFooter({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="list-footer" className={cn("text-footnote text-muted-foreground", className)} {...props} />
}

export {
  List,
  ListSection,
  ListSectionHeader,
  ListRow,
  ListRowMedia,
  ListRowBody,
  ListRowTitle,
  ListRowMeta,
  ListRowTrailing,
  ListRowChevron,
  ListFooter,
}
