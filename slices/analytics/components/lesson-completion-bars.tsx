// analytics slice — presentational per-materi completion bars. Pure/props-
// driven; simple div bars with role="progressbar" (no new chart lib —
// assignment #17; same accessible pattern as slices/progress).
// `denominator` is the tenant member count: the bar shows the SHARE of members
// who completed each materi; the raw count renders beside it.
//
// MATERI MODEL (DECISIONS #37): the list is FLAT and already in teaching order
// (courseLessons.order). There is no module grouping to render — a materi can
// sit in several courses at once, so a per-module heading would be a lie about
// where the content lives. The position number is the placement's order in
// THIS course, which is the only ranking that still means anything.
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

  return (
    <ol className={cn("space-y-3", className)}>
      {lessons.map((lesson, index) => {
        const percent = toPercent(lesson.completedCount, denominator);
        const countLabel = `${lesson.completedCount}/${denominator} ${copy.completedSuffix}`;
        return (
          <li key={lesson.lessonId} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="shrink-0 bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-foreground">{lesson.title}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{countLabel}</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={countLabel}
              className="h-2 w-full overflow-hidden bg-muted"
            >
              <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
