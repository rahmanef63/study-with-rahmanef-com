// analytics slice — one end of the community's read distribution (most-read or
// least-read). Pure/props-driven.
//
// A ZERO IS THE MOST USEFUL ROW ON THIS SCREEN. `tenantPulse` deliberately
// folds materi with no reads at all into `leastRead`, so this list renders
// "0 pembaca" as a first-class value rather than hiding the rows that are
// actually worth acting on. Do not add an `if (viewedCount === 0) return null`.
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import type { PulseMateriData } from "../types";

export type PulseMateriListProps = {
  title: string;
  materi: readonly PulseMateriData[];
  /** Rendered under the list — the "so what" for the least-read end. */
  hint?: string;
  /** Builds the permalink for a row. Omit to render the titles as plain text. */
  hrefFor?: (slug: string) => string;
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function PulseMateriList({
  title,
  materi,
  hint,
  hrefFor,
  copy: copyOverride,
  className,
}: PulseMateriListProps) {
  const copy = mergeAnalyticsCopy(copyOverride);

  return (
    <section className={cn("space-y-2", className)}>
      <h4 className="eyebrow">{title}</h4>
      {materi.length === 0 ? (
        <p className="text-footnote text-muted-foreground">{copy.emptyPulseMateri}</p>
      ) : (
        <ol className="border-2 border-border bg-card">
          {materi.map((row, index) => {
            const href = row.slug !== null && hrefFor !== undefined ? hrefFor(row.slug) : null;
            const label = (
              <span className="min-w-0 text-footnote [overflow-wrap:anywhere]">{row.title}</span>
            );
            return (
              <li
                key={row.lessonId}
                className={cn(
                  "flex items-start justify-between gap-3 px-3 py-2",
                  index > 0 && "border-t border-border"
                )}
              >
                {/* An unslugged materi (a draft that never got a permalink) has
                    nowhere to link to. Plain text, not a dead href. */}
                {href === null ? (
                  label
                ) : (
                  <a href={href} className="min-w-0 underline-offset-4 hover:underline">
                    {label}
                  </a>
                )}
                <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                  {row.viewedCount} {copy.readersUnit}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {hint === undefined ? null : (
        <p className="text-caption text-muted-foreground">{hint}</p>
      )}
    </section>
  );
}
