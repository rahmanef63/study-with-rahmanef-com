// progress slice — presentational course progress bar. Injected into the
// courses barrel seam CourseOverview.progressSlot. Pure/props-driven (no data
// fetching, no hardcoded copy) so it is portable and unit-testable; the
// connected CourseProgress view feeds it live counts. Theme tokens only, and an
// accessible role="progressbar" (no shadcn Progress primitive in this app).
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPercent } from "../lib/percent";
import { mergeProgressCopy, type ProgressCopyOverride } from "../config/copy";

export type CourseProgressBarProps = {
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  copy?: ProgressCopyOverride;
  className?: string;
};

export function CourseProgressBar({
  completedCount,
  totalCount,
  isComplete,
  copy: copyOverride,
  className,
}: CourseProgressBarProps) {
  const copy = mergeProgressCopy(copyOverride);

  if (totalCount <= 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyProgress}</p>;
  }

  const percent = toPercent(completedCount, totalCount);
  const countLabel = `${completedCount}/${totalCount} ${copy.lessonsUnit} ${copy.completedSuffix}`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">{copy.progressTitle}</span>
        {isComplete ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {copy.courseCompleteBadge}
          </span>
        ) : (
          <span className="text-muted-foreground">{countLabel}</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={countLabel}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
