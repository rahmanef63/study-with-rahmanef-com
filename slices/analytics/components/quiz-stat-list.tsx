// analytics slice — presentational quiz stats: attempts, passes, and a
// pass-rate bar. Pure/props-driven; div bars + theme tokens only (no chart lib
// — assignment #17).
//
// MATERI MODEL (DECISIONS #37): a quiz belongs to the COURSE, not to a module,
// so a row is titled by the quiz itself — there is no module name left to
// qualify it with.
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import type { CourseQuizStat } from "../types";

export type QuizStatListProps = {
  quizzes: CourseQuizStat[];
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function QuizStatList({ quizzes, copy: copyOverride, className }: QuizStatListProps) {
  const copy = mergeAnalyticsCopy(copyOverride);

  if (quizzes.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyQuizzes}</p>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {quizzes.map((quiz) => {
        const rateLabel = `${copy.passRateLabel} ${quiz.passRatePct}%`;
        return (
          <div key={quiz.quizId} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-foreground">{quiz.quizTitle}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {quiz.attemptCount} {copy.attemptsUnit} · {quiz.passCount} {copy.passedUnit}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={quiz.passRatePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={rateLabel}
              className="h-2 w-full overflow-hidden bg-muted"
            >
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${quiz.passRatePct}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground">{rateLabel}</p>
          </div>
        );
      })}
    </div>
  );
}
