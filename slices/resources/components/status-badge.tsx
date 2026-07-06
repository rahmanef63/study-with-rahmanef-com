// resources slice — status chip. A styled <span> (not an interactive primitive,
// so the shadcn-primitive rule doesn't apply); tone comes from theme tokens via
// lib/status.ts — never hex.
import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  label: string;
  /** Tone classes from resourceStatusTone / suggestionStatusTone. */
  tone: string;
  className?: string;
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className
      )}
    >
      {label}
    </span>
  );
}
