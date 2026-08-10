import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva("group/card flex flex-col text-card-foreground", {
  variants: {
    variant: {
      // Arcade: a hard 2px frame and an offset block instead of a rounded card
      // with a blur. --radius is 0 so `rounded-*` would be a no-op anyway.
      default: "gap-6 border-2 bg-card py-6 shadow-[3px_3px_0_0_var(--pixel-shadow)]",
      // NO FRAME. For the case this repo gets wrong constantly: a LIST of
      // things. N framed cards stacked vertically is N frames and N shadows
      // saying nothing, which is the "semua isinya kotak berbingkai" complaint
      // in one sentence. Use `plain` when the item is already inside a group,
      // or reach for <List>/<ListRow> (components/ui/list.tsx), which is the
      // right primitive for a list and draws exactly one frame for all of it.
      plain: "gap-4 bg-transparent py-0",
      // Framed, but flush against the screen edges on a phone — the same
      // full-bleed rule the grouped list uses, for a card that is the whole
      // width of the screen rather than an object sitting on it.
      bleed:
        "list-bleed gap-6 border-y-2 bg-card py-6 sm:border-2 sm:shadow-[3px_3px_0_0_var(--pixel-shadow)]",
    },
  },
  defaultVariants: { variant: "default" },
})

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
 return (
    <div
 data-slot="card"
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-header"
 className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        // A plain card has no frame, so it has no gutter to pad against either.
        "group-data-[variant=plain]/card:px-0",
 className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-title"
 // BODY face on purpose — Press Start 2P truncates a title of any real
      // length. `text-title` rather than `leading-none`: a two-line title needs
      // leading, and `leading-none` is what made wrapped card titles collide.
 className={cn("text-title font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-description"
 className={cn("text-footnote text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-action"
 className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
 className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-content"
 className={cn("px-6 group-data-[variant=plain]/card:px-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-footer"
 className={cn("flex items-center px-6 group-data-[variant=plain]/card:px-0 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
