// pageviews slice — presentational horizontal-bar ranking list (top
// paths/referrers/countries/cities). Pure/props-driven; same visual grammar as
// slices/analytics/lesson-completion-bars (label + count above a token bar).
import { cn } from "@/lib/utils";

export type HBarItem = { label: string; value: number };

export type HBarListProps = {
  items: HBarItem[];
  /** Suffix after the count, e.g. "×". Optional. */
  unit?: string;
  className?: string;
};

export function HBarList({ items, unit, className }: HBarListProps) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((it, i) => (
        <li key={`${it.label}-${i}`} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{it.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {it.value.toLocaleString("id-ID")}
              {unit ?? ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
