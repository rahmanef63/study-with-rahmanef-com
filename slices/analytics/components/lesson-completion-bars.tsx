// analytics slice — presentational per-lesson completion bars, grouped by
// module. Pure/props-driven; simple div bars with role="progressbar" (no new
// chart lib — assignment #17; same accessible pattern as slices/progress).
// `denominator` is the tenant member count: the bar shows the SHARE of members
// who completed each lesson; the raw count renders beside it.
import { toPercent } from "@/features/progress";
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import type { LessonCompletionStat } from "../types";

export type LessonCompletionBarsProps = {
  lessons: LessonCompletionStat[];
  /** Tenant member count — the bar denominator. 0 renders empty bars. */
  denominator: number;
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function LessonCompletionBars({
  lessons,
  denominator,
  copy: copyOverride,
  className,
}: LessonCompletionBarsProps) {
  const copy = mergeAnalyticsCopy(copyOverride);

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyLessons}</p>;
  }

  let lastModuleId: LessonCompletionStat["moduleId"] | null = null;
  return (
    <div className={cn("space-y-3", className)}>
      {lessons.map((lesson) => {
        const showModule = lesson.moduleId !== lastModuleId;
        lastModuleId = lesson.moduleId;
        const percent = toPercent(lesson.completedCount, denominator);
        const countLabel = `${lesson.completedCount}/${denominator} ${copy.completedSuffix}`;
        return (
          <div key={lesson.lessonId} className="space-y-1">
            {showModule ? (
              <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {lesson.moduleTitle}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-foreground">{lesson.title}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{countLabel}</span>
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
      })}
    </div>
  );
}
