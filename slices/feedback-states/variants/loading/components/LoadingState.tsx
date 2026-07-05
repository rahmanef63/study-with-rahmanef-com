import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  /** Visible label next to the spinner. Default `"Loading…"`. */
  label?: string;
  /**
   * `inline` — spinner + label in flowing text (buttons, badges).
   * `block` — centered column with breathing room (panel bodies).
   * `overlay` — absolute blur veil over a `relative` parent (mutations
   * in place).
   */
  variant?: "inline" | "block" | "overlay";
  className?: string;
}

/**
 * Spinner-based loading indicator — the SSOT for "work in flight"
 * states where a skeleton would be wrong (actions, refetches,
 * overlays). Composes the shadcn `Spinner` primitive.
 */
export function LoadingState({
  label = "Loading…",
  variant = "block",
  className,
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <span
        aria-busy="true"
        className={cn(
          "inline-flex items-center gap-2 text-sm text-muted-foreground",
          className,
        )}
      >
        <Spinner className="size-3.5" />
        {label}
      </span>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        aria-busy="true"
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center gap-2",
          "bg-background/60 text-sm text-muted-foreground backdrop-blur-[2px]",
          className,
        )}
      >
        <Spinner />
        {label}
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12",
        "text-sm text-muted-foreground",
        className,
      )}
    >
      <Spinner className="size-5" />
      {label}
    </div>
  );
}
