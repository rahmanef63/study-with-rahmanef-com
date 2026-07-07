"use client";
// quiz slice — graded result + per-question review (QuizResultCard). Purely
// presentational: it renders the AttemptResult returned by submitAttempt plus
// the (answer-stripped) question prompts/options the member just saw. Pass/fail
// uses theme tokens only (primary / destructive) — no invented status colors.
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeQuizCopy, type QuizCopyOverride } from "../config/copy";
import type { AttemptResult, QuizPublicQuestion } from "../types";

export type QuizResultCardProps = {
  result: AttemptResult;
  questions: QuizPublicQuestion[];
  copy?: QuizCopyOverride;
  onRetry?: () => void;
  className?: string;
};

export function QuizResultCard({ result, questions, copy: copyOverride, onRetry, className }: QuizResultCardProps) {
  const copy = mergeQuizCopy(copyOverride);
  const toneText = result.passed ? "text-primary" : "text-destructive";

  return (
    <div className={className ? `space-y-5 ${className}` : "space-y-5"}>
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">{copy.yourScore}</CardDescription>
          <CardTitle
            className={`font-serif text-5xl font-semibold tabular-nums sm:text-6xl ${toneText}`}
          >
            {result.scorePct}%
          </CardTitle>
          <p className={`text-sm font-medium text-pretty ${toneText}`}>
            {result.passed ? copy.passed : copy.failed}
            <span className="font-normal text-muted-foreground">
              {" · "}
              {copy.correctCount}: <span className="tabular-nums">{result.correctCount}/{result.totalQuestions}</span>
              {" · "}
              {copy.passingScore} <span className="tabular-nums">{result.passingScorePct}%</span>
            </span>
          </p>
        </CardHeader>
      </Card>

      <section aria-label={copy.reviewAnswers} className="space-y-3">
        <h3 className="eyebrow border-b pb-2">{copy.reviewAnswers}</h3>
        {result.results.map((r) => {
          const q = questions[r.questionIndex];
          if (q === undefined) return null;
          return (
            <Card key={r.questionIndex}>
              <CardHeader>
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className={`mt-0.5 shrink-0 rounded-full p-1 ${
                      r.isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {r.isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <CardTitle className="text-base font-medium leading-snug">
                    {r.questionIndex + 1}. {q.prompt}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className={r.isCorrect ? "text-foreground" : "text-destructive"}>
                  <span className="text-muted-foreground">{copy.yourAnswer}: </span>
                  {q.options[r.yourAnswer] ?? "—"} {r.isCorrect ? `(${copy.correct})` : `(${copy.incorrect})`}
                </p>
                {!r.isCorrect && (
                  <p className="text-foreground">
                    <span className="text-muted-foreground">{copy.correctAnswer}: </span>
                    {q.options[r.correctIndex] ?? "—"}
                  </p>
                )}
                {r.explanation !== undefined && r.explanation.trim() !== "" && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">{copy.explanation}: </span>
                    {r.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {onRetry !== undefined && (
        <div className="flex justify-end">
          <Button variant="outline" className="min-h-11" onClick={onRetry}>
            {copy.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
