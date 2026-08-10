import { cn } from "@/lib/utils"

// No radius (--radius is 0, so `rounded-md` promised a shape the real content
// never has) and `bg-muted` rather than `bg-accent`: accent is phosphor cyan in
// this palette, so a loading list used to flash as a stack of bright cyan bars.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
