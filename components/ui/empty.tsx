import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        // `border-dashed` with no border-width never drew anything, and
        // `rounded-lg` resolves to 0 — both were decoration that lied about
        // what this renders. An empty state is a message, not a box.
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-6 text-center text-balance md:p-12",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    />
  )
}

// THERE IS NO `illustration` VARIANT, ON PURPOSE.
//
// The asset pack ships public/ui/empty-{courses,results,notifications}.webp and
// this is the slot they would plug into. All three were opened and measured
// before being declined; they are not illustrations, they are SCREENSHOTS OF AN
// EMPTY STATE — this component's output, flattened to a raster:
//
//   file                     flat field   glyph   baked text
//   empty-courses.webp         98.8%      0.35%   "Belum ada kelas" +
//                                                 "Kelas baru akan muncul di sini."
//   empty-results.webp         99.1%      0.16%   "Tidak ada hasil" +
//                                                 "Coba kata kunci lain."
//   empty-notifications.webp   98.9%      0.11%   "Tidak ada notifikasi" +
//                                                 "Semua sudah dibaca."
//
// Wiring one in prints the copy TWICE. The baked strings are near-verbatim
// duplicates of what the call sites already pass — courses/config/copy.ts has
// `emptyManageTitle: "Belum ada kelas"`, search/config/copy.ts has
// `emptyTitle: "Tidak ada hasil"` — so `<EmptyTitle>Tidak ada hasil</EmptyTitle>`
// would render directly above a picture of itself. The pictured copy cannot be
// selected, searched, translated, restyled, or read by a screen reader, and it
// is 1200x800 of it. UI copy is Bahasa Indonesia by contract; freezing it into
// a raster is the one way to make it unmaintainable.
//
// What is actually IN the images is a single monochrome glyph — an outlined
// square, a "?", a "!" — at 0.11-0.35% of the canvas. `variant="icon"` already
// renders exactly that, as a lucide vector, in tokens, at any size, for ~0 B.
// The remaining ~99% is flat #071536, which is not `--background` (#090f1c) or
// `--muted` (#1b2331), so the file would land on the page as a visibly bluer
// rectangle no token can correct.
//
// So: nothing to wire. The three files stay unused rather than being given a
// home they do not fit — inventing an `illustration` variant to host a picture
// of the very component hosting it is a loop, not a feature.
const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center border-2 bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        // `text-sm/relaxed` was a screen inventing its own leading — the size
        // token already carries one. See THE TYPE SCALE in app/globals.css.
        "text-body text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-footnote text-balance",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
