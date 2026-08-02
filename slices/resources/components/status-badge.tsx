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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </span>
  );
}
