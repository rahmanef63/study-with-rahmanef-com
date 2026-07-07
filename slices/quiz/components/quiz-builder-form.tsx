"use client";
// quiz slice — the full builder form (title, passing score, question list).
// Owns local draft state; the server re-validates everything on save (P0).
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizCopy } from "../config/copy";
import { MAX_QUESTIONS, MAX_TITLE_CHARS, MIN_OPTIONS } from "../config/limits";
import type { QuizQuestionInput } from "../types";
import { QuizQuestionEditor } from "./quiz-question-editor";

export type QuizBuilderFormValues = {
  title: string;
  passingScorePct: number;
  questions: QuizQuestionInput[];
};

export type QuizBuilderFormProps = {
  initial?: QuizBuilderFormValues;
  onSave: (values: QuizBuilderFormValues) => void | Promise<void>;
  submitting: boolean;
  copy: QuizCopy;
};

const emptyQuestion = (): QuizQuestionInput => ({
  prompt: "",
  options: Array.from({ length: MIN_OPTIONS }, () => ""),
  correctIndex: 0,
  explanation: "",
});

export function QuizBuilderForm({ initial, onSave, submitting, copy }: QuizBuilderFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [passingScorePct, setPassingScorePct] = useState(initial?.passingScorePct ?? 60);
  const [questions, setQuestions] = useState<QuizQuestionInput[]>(
    initial?.questions ?? [emptyQuestion()]
  );

  const setQuestion = (index: number, next: QuizQuestionInput) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? next : q)));
  const removeQuestion = (index: number) =>
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  const addQuestion = () =>
    setQuestions((qs) => (qs.length >= MAX_QUESTIONS ? qs : [...qs, emptyQuestion()]));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          title: title.trim(),
          passingScorePct,
          questions: questions.map((q) => ({
            prompt: q.prompt.trim(),
            options: q.options.map((o) => o.trim()),
            correctIndex: q.correctIndex,
            explanation: q.explanation?.trim() === "" ? undefined : q.explanation?.trim(),
          })),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="quiz-title">{copy.fieldTitle}</Label>
          <Input
            id="quiz-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={MAX_TITLE_CHARS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-passing">{copy.fieldPassing}</Label>
          <Input
            id="quiz-passing"
            type="number"
            className="sm:w-28"
            value={passingScorePct}
            onChange={(e) => setPassingScorePct(Number(e.target.value))}
            required
            min={0}
            max={100}
            step={1}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="eyebrow flex items-baseline gap-2 border-b pb-2">
          {copy.fieldPrompt}
          <span className="tabular-nums text-foreground/70">
            {questions.length}/{MAX_QUESTIONS}
          </span>
        </p>
        {questions.map((question, index) => (
          <QuizQuestionEditor
            key={index}
            index={index}
            question={question}
            onChange={(next) => setQuestion(index, next)}
            onRemove={() => removeQuestion(index)}
            canRemove={questions.length > 1}
            copy={copy}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={addQuestion}
          disabled={questions.length >= MAX_QUESTIONS}
        >
          <Plus className="size-4" aria-hidden /> {copy.addQuestion}
        </Button>
        <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={submitting}>
          {submitting ? copy.saving : copy.save}
        </Button>
      </div>
    </form>
  );
}
