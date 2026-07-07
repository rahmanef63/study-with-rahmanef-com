// resources slice — warm empty state shared by the resource grid, suggestion
// list, and review queue. Presentational only: an icon medallion, a guiding
// line, and an optional anchor CTA (jumps to the submit form via #hash — no JS).
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BoardEmptyStateProps = {
  icon: LucideIcon;
  message: string;
  /** Optional call-to-action; `href` is usually an in-page #anchor. */
  cta?: { label: string; href: string };
};

export function BoardEmptyState({ icon: Icon, message, cta }: BoardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <span
        className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      {cta && (
        <a
          href={cta.href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 px-5")}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}
