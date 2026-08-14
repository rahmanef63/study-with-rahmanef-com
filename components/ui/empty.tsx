import { cva, type VariantProps } from "class-variance-authority"

import { ART_SIZE } from "@/lib/art"
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

// THERE IS STILL NO `illustration` VARIANT, AND STILL ON PURPOSE — but the
// reason below is now about ONE REJECTED PACK, not about images as a class.
//
// RESOLVED 2026-08-13. A second art drop landed and it clears every objection
// recorded here: the sprites under public/ui/{empty,status,spot} carry no baked
// text at all, and their flat field was flood-filled to real transparency by
// scripts/normalise-art-pack.mjs, so nothing lands on the page as a
// wrong-coloured rectangle. They are wired through `EmptyArt` at the bottom of
// this file, which renders into `variant="default"` — a slot that already
// centres an unconstrained child, so no variant had to be invented. The
// argument below still stands and is kept because it is the test any FUTURE
// drop has to pass: open the file, measure the baked text, check the field
// colour against the token.
//
// The declined pack, for the record:
//
// public/ui/empty-{courses,results,notifications}.webp were opened and measured
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
// So: nothing to wire. The three files stayed unused rather than being given a
// home they do not fit — inventing an `illustration` variant to host a picture
// of the very component hosting it is a loop, not a feature. They have since
// been deleted; the replacements are named above.
const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center border bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
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

/**
 * The illustrated media slot. `<EmptyArt src={...} />` in place of
 * `<EmptyMedia variant="icon"><SomeLucideIcon /></EmptyMedia>`.
 *
 * A component rather than an `<img>` per call site because the five attributes
 * that make it correct — `alt=""`, explicit `width`/`height`, lazy decode, and
 * `pixelated` so the art keeps its hard edges instead of being smoothed by the
 * browser's downscaler — are the kind that get copied four times and typo'd on
 * the fifth.
 *
 * `alt=""` is not laziness and is not overridable: every one of these sits
 * directly above an `<EmptyTitle>` that already says the thing in words. Naming
 * the picture too would make a screen reader announce the same message twice.
 *
 * SIZE IS EXPLICIT AND SQUARE, and comes from `ART_SIZE` in lib/art.ts —
 * that file is the one place the illustration scale is written down, and it
 * also records why FONT and COLOUR are deliberately NOT configured in TS.
 * The sprites are 185-256px on their longest side; rendering one at its
 * natural size would put a 256px picture above a two-line message.
 */
function EmptyArt({
  src,
  size = ART_SIZE.media,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { src: string; size?: number }) {
  return (
    <EmptyMedia className={className} {...props}>
      {/* eslint-disable-next-line @next/next/no-img-element -- committed static
          asset at a stable path; next/image would add an optimiser pass to
          re-encode a file that is already WebP and under 30 KB. */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="pixelated object-contain"
        style={{ width: size, height: size }}
      />
    </EmptyMedia>
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
  EmptyArt,
}
