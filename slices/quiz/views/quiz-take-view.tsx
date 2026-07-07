"use client";
// quiz slice — member quiz-taking page (QuizTakeView). The server query is the
// gate (member + draft-invisibility); this renders the answer-stripped quiz,
// collects a single choice per question, and submits for server-side grading.
// After submit it shows QuizResultCard (the only place answers/explanations
// appear). The integrator mounts this on the lesson/module surface.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className={className ? `space-y-4 ${className}` : "space-y-4"}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {copy.startHint} {copy.passingScore}: {quiz.passingScorePct}%
          </p>
        </CardHeader>
      </Card>

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
          {copy.previousAttempts}: {attempts.length} · {copy.attemptScore}{" "}
          {Math.max(...attempts.map((a) => a.scorePct))}%
        </p>
      )}

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-end gap-3 rounded-xl border bg-background/80 px-3 py-2 backdrop-blur">
        <span className="mr-auto text-xs text-muted-foreground">
          {answeredCount}/{quiz.questions.length} {copy.answered}
        </span>
        {!allAnswered && <span className="text-xs text-muted-foreground">{copy.answerAllFirst}</span>}
        <Button className="min-h-11" onClick={() => void handleSubmit()} disabled={!allAnswered || isPending}>
          {isPending ? copy.submitting : copy.submit}
        </Button>
      </div>
    </div>
  );
}
