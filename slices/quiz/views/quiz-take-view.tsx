"use client";
// quiz slice — member quiz-taking page (QuizTakeView). The server query is the
// gate (member + draft-invisibility); this renders the answer-stripped quiz,
// collects a single choice per question, and submits for server-side grading.
// After submit it shows QuizResultCard (the only place answers/explanations
// appear). The integrator mounts this on the lesson/module surface.
import { useMemo, useState } from "react";
import { Award, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  moduleId: Id<"modules">;
  copy?: QuizCopyOverride;
  className?: string;
};

export function QuizTakeView({ moduleId, copy: copyOverride, className }: QuizTakeViewProps) {
  const copy = mergeQuizCopy(copyOverride);
  const quiz = useQuizForTaking(moduleId);
  const attempts = useMyAttempts(quiz?._id);
  const { submitAttempt, isPending } = useSubmitAttempt(copyOverride);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);

  const allAnswered = useMemo(
    () => quiz != null && Object.keys(answers).length === quiz.questions.length,
    [answers, quiz]
  );
  const answeredCount = Object.keys(answers).length;

  if (quiz === undefined) {
    return (
      <div className={className}>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (quiz === null) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">{copy.noQuiz}</CardContent>
      </Card>
    );
  }

  if (result !== null) {
    return (
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
    );
  }

  const handleSubmit = async () => {
    if (!allAnswered) return;
    const ordered = quiz.questions.map((_, i) => answers[i]);
    const graded = await submitAttempt(quiz._id, ordered);
    if (graded !== null) setResult(graded);
  };

  const progressPct =
    quiz.questions.length > 0 ? (answeredCount / quiz.questions.length) * 100 : 0;

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <Hero eyebrow={copy.quizTitle} title={quiz.title} description={copy.startHint}>
        <Badge tone="accent">
          {copy.passingScore}: {quiz.passingScorePct}%
        </Badge>
      </Hero>

      {/* Reading column — comfortable measure for the quiz body (stats,
          questions, submit) while the Hero above spans the full window. */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {attempts !== undefined && attempts.length > 0 && (
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
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
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

        <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-[var(--radius-win)] border border-border bg-background/85 p-3 shadow-sm backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] @sm:flex-row @sm:items-center">
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
            className="min-h-11 w-full @sm:w-auto"
            onClick={() => void handleSubmit()}
            disabled={!allAnswered || isPending}
          >
            {isPending ? copy.submitting : copy.submit}
          </Button>
        </div>
      </div>
    </div>
  );
}
