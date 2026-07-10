// analytics slice — presentational quiz stats per module: attempts, passes,
// and a pass-rate bar. Pure/props-driven; div bars + theme tokens only (no
// chart lib — assignment #17).
import { cn } from "@/lib/utils";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import type { ModuleQuizStat } from "../types";

export type QuizStatListProps = {
  quizzes: ModuleQuizStat[];
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
              <span className="min-w-0 truncate text-foreground">
                <span className="font-medium">{quiz.moduleTitle}</span>
                <span className="text-muted-foreground"> · {quiz.quizTitle}</span>
              </span>
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
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
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
