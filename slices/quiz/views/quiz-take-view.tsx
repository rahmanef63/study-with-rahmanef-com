"use client";
// quiz slice — member quiz-taking page (QuizTakeView). The server query is the
// gate (member + draft-invisibility); this renders the answer-stripped quiz,
// collects a single choice per question, and submits for server-side grading.
// After submit it shows QuizResultCard (the only place answers/explanations
// appear). The integrator mounts this on the lesson/module surface.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className={className ? `space-y-5 ${className}` : "space-y-5"}>
      <header className="border-b pb-4">
        <span className="eyebrow">{copy.quizTitle}</span>
        <h2 className="mt-1.5 text-2xl sm:text-3xl">{quiz.title}</h2>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          {copy.startHint}{" "}
          <span className="whitespace-nowrap">
            {copy.passingScore}:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {quiz.passingScorePct}%
            </span>
          </span>
        </p>
      </header>

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

      {attempts !== undefined && attempts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {copy.previousAttempts}: <span className="tabular-nums">{attempts.length}</span> ·{" "}
          {copy.attemptScore}{" "}
          <span className="font-medium tabular-nums text-foreground">
            {Math.max(...attempts.map((a) => a.scorePct))}%
          </span>
        </p>
      )}

      <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border bg-background/85 p-3 shadow-sm backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center">
        <div className="min-w-0 text-xs text-muted-foreground sm:mr-auto">
          <span className="font-medium tabular-nums text-foreground">
            {answeredCount}/{quiz.questions.length}
          </span>{" "}
          {copy.answered}
          {!allAnswered && (
            <span className="block sm:inline"> · {copy.answerAllFirst}</span>
          )}
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
          onClick={() => void handleSubmit()}
          disabled={!allAnswered || isPending}
        >
          {isPending ? copy.submitting : copy.submit}
        </Button>
      </div>
    </div>
  );
}
