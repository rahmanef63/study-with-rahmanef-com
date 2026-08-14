// analytics slice — THE ACCESSIBLE TRUTH of the drop-off. Pure/props-driven.
//
// The chart above this list is a summary; this is the data. Everything the
// curve encodes as a shape is written here as a number and read aloud in order
// by a screen reader: position, title, readers, completions, and the fall from
// the step before. If the two ever disagree, this one is right — which is why
// the chart is `aria-hidden` and this is not.
//
// THE DROP MARKER IS THE POINT. A list of counts makes you subtract in your
// head; the marker between two rows states the subtraction, and the worst one
// on the screen is called out in the destructive tone. That is the difference
// between "here are my numbers" and "here is where people stop".
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import { biggestDrop, lostBefore } from "../lib/dropoff";
import type { FunnelStepData } from "../types";

export type FunnelStepListProps = {
  steps: readonly FunnelStepData[];
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function FunnelStepList({ steps, copy: copyOverride, className }: FunnelStepListProps) {
  const copy = mergeAnalyticsCopy(copyOverride);
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyLessons}</p>;
  }
  const worst = biggestDrop(steps);

  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const lost = lostBefore(steps, index);
        const isWorst = worst !== null && worst.stepIndex === index;
        return (
          <li key={step.lessonId}>
            {lost === null ? null : (
              // The gap between two rows is where the loss happened, so the
              // marker literally sits in it. Not a row of its own: it is an
              // edge, and giving it a row would imply a materi that is not there.
              <p
                className={cn(
                  "flex items-center gap-1.5 py-1 pl-2 text-caption tabular-nums",
                  isWorst ? "font-medium text-destructive-text" : "text-muted-foreground"
                )}
              >
                <span aria-hidden>▼</span>
                {lost} {copy.dropLostUnit}
              </p>
            )}
            <div
              className={cn(
                "space-y-1.5 border px-3 py-2.5",
                isWorst ? "border-destructive bg-destructive/5" : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-px shrink-0 bg-muted px-1.5 py-0.5 text-caption tabular-nums text-muted-foreground"
                  >
                    {index + 1}
                  </span>
                  {/* Wraps rather than truncates: on a 390px screen a truncated
                      materi title is indistinguishable from the next one, and
                      knowing WHICH materi is the entire answer. */}
                  <span className="min-w-0 text-footnote [overflow-wrap:anywhere]">
                    {step.title}
                  </span>
                </span>
                <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                  {step.retentionPct}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={step.retentionPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${step.viewedCount} ${copy.readersUnit}, ${step.completedCount} ${copy.completedSuffix}`}
                className="h-2 w-full overflow-hidden bg-muted"
              >
                <div
                  className={cn("h-full", isWorst ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${step.retentionPct}%` }}
                />
              </div>

              <p className="text-caption tabular-nums text-muted-foreground">
                {step.viewedCount} {copy.readersUnit} · {step.completedCount}{" "}
                {copy.completedSuffix}
                {/* Re-reads only shown when they exist: on a materi read once by
                    each person the two numbers are equal and the second is noise. */}
                {step.viewCount > step.viewedCount
                  ? ` · ${step.viewCount} ${copy.rereadUnit}`
                  : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
