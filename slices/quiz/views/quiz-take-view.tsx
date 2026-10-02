"use client";
// Member quiz session; server query owns authorization and answer stripping.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, Hero, SectionHeader, StatTile } from "@/components/mockup-kit";
import type { Id } from "@convex/_generated/dataModel";
import { QuizQuestionCard } from "../components/quiz-question-card";
import { QuizResultCard } from "../components/quiz-result-card";
import { mergeQuizCopy, type QuizCopyOverride } from "../config/copy";
import { useSubmitAttempt } from "../hooks/use-quiz-mutations";
import { useMyAttempts, useQuizForTaking } from "../hooks/use-quiz";
import type { AttemptResult } from "../types";

export type QuizTakeViewProps = {
  quizId: Id<"quizzes">;
  backHref?: string;
  copy?: QuizCopyOverride;
  className?: string;
};

export function QuizTakeView({ backHref, ...props }: QuizTakeViewProps) {
  const copy = mergeQuizCopy(props.copy);
  return (
    <div className="space-y-4">
      {backHref && (
        <Button asChild variant="ghost" className="min-h-11">
          <Link href={backHref}><ArrowLeft aria-hidden />{copy.backToCourse}</Link>
        </Button>
      )}
      {/* Route changes must discard answers, results, and pending submissions. */}
      <QuizSession key={props.quizId} {...props} />
    </div>
  );
}

function QuizSession({ quizId, copy: copyOverride, className }: QuizTakeViewProps) {
  const copy = mergeQuizCopy(copyOverride);
  const quiz = useQuizForTaking(quizId);
  const attempts = useMyAttempts(quizId);
  const { submitAttempt, isPending } = useSubmitAttempt(copyOverride);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const frame = useRef<HTMLDivElement>(null);
  const ready = quiz !== undefined && attempts !== undefined;
  useEffect(() => {
    if (ready) frame.current?.focus();
  }, [ready, result]);
  const allAnswered = quiz !== undefined && quiz.questions.length > 0 &&
    quiz.questions.every((question, index) => Number.isInteger(answers[index]) &&
      answers[index] >= 0 && answers[index] < question.options.length);
  const answeredCount = Object.keys(answers).length;

  if (quiz === undefined || attempts === undefined) {
    return (
      <div className={className}>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (result !== null) {
    return (
      <div ref={frame} tabIndex={-1} role="group" aria-label={`${copy.yourScore}: ${result.scorePct}%`} className="outline-none">
        <QuizResultCard
          result={result}
          questions={quiz.questions}
          copy={copyOverride}
          className={className}
          onRetry={() => {
            setResult(null);
            setAnswers({});
          }}
        />
      </div>
    );
  }

  const limitReached = quiz.attemptsAllowed !== undefined && attempts.length >= quiz.attemptsAllowed;
  const handleSubmit = async () => {
    if (!allAnswered || isPending || limitReached) return;
    const ordered = quiz.questions.map((_, i) => answers[i]);
    const graded = await submitAttempt(quiz._id, ordered);
    if (graded !== null) setResult(graded);
  };

  const progressPct =
    quiz.questions.length > 0 ? (answeredCount / quiz.questions.length) * 100 : 0;

  return (
    <div ref={frame} tabIndex={-1} role="group" aria-label={quiz.title} className={`outline-none space-y-6 ${className ?? ""}`}>
      <Hero eyebrow={copy.quizTitle} title={quiz.title} description={limitReached ? undefined : copy.startHint}>
        <Badge tone="accent">
          {copy.passingScore}: {quiz.passingScorePct}%
        </Badge>
      </Hero>

      <div className="mx-auto w-full max-w-2xl space-y-6">
        {attempts.length > 0 && (
          <div className="grid gap-3 @sm:grid-cols-2">
            <StatTile
              icon={<History className="size-5" aria-hidden />}
              label={copy.previousAttempts}
              value={attempts.length}
            />
            <StatTile
              icon={<Award className="size-5" aria-hidden />}
              label={copy.attemptScore}
              value={`${Math.max(...attempts.map((a) => a.scorePct))}%`}
            />
          </div>
        )}

        {limitReached ? (
          <p role="status" className="border border-border bg-muted p-4 text-sm">{copy.attemptsExhausted}</p>
        ) : <>
        {quiz.attemptsAllowed !== undefined && (
          <p className="text-sm text-muted-foreground">{copy.attemptsRemaining}: {quiz.attemptsAllowed - attempts.length}</p>
        )}
        <section className="space-y-4">
          <SectionHeader
            title={`${quiz.questions.length} ${copy.question}`}
            actions={
              <Badge tone={allAnswered ? "success" : "muted"}>
                {answeredCount}/{quiz.questions.length}
              </Badge>
            }
          />
          <div
            role="progressbar"
            aria-label={`${copy.question}: ${answeredCount}/${quiz.questions.length}`}
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={quiz.questions.length}
            className="h-1.5 w-full overflow-hidden bg-muted"
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {quiz.questions.map((question, index) => (
            <QuizQuestionCard
              key={index}
              index={index}
              total={quiz.questions.length}
              question={question}
              name={`q-${index}`}
              value={answers[index] ?? null}
              onChange={(optionIndex) => setAnswers((prev) => ({ ...prev, [index]: optionIndex }))}
              questionLabel={copy.question}
              ofLabel={copy.of}
              disabled={isPending}
            />
          ))}
        </section>

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-background p-3 supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] @sm:flex-row @sm:items-center">
          <div className="min-w-0 text-xs text-muted-foreground @sm:mr-auto">
            <span className="font-medium tabular-nums text-foreground">
              {answeredCount}/{quiz.questions.length}
            </span>{" "}
            {copy.answered}
            {!allAnswered && (
              <span className="block @sm:inline"> · {copy.answerAllFirst}</span>
            )}
          </div>
          <Button
            type="button"
            className="min-h-11 w-full @sm:w-auto"
            onClick={() => void handleSubmit()}
            disabled={!allAnswered || isPending}
            aria-busy={isPending}
          >
            {isPending ? copy.submitting : copy.submit}
          </Button>
        </div>
        </>}
      </div>
    </div>
  );
}
