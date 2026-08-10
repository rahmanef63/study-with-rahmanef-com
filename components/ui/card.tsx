import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card"
 className={cn(
        // Arcade: a hard 2px frame and an offset block instead of a rounded card
        // with a blur. --radius is 0 so `` would be a no-op anyway.
        "flex flex-col gap-6 border-2 bg-card py-6 text-card-foreground shadow-[3px_3px_0_0_var(--pixel-shadow)]",
 className
      )}
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
 className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-description"
 className={cn("text-sm text-muted-foreground", className)}
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
 className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
 return (
    <div
 data-slot="card-footer"
 className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
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
