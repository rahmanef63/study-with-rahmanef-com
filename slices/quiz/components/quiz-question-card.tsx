"use client";
// quiz slice — one taking question (single-select). Presentational: the parent
// view owns the answers array. Uses a native radio group (accessible: keyboard
// + screen reader) with shadcn Label + theme tokens; raw <button>/<a>/<img> are
// the lint-restricted elements, radios are fine.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { QuizPublicQuestion } from "../types";

export type QuizQuestionCardProps = {
  index: number;
  total: number;
  question: QuizPublicQuestion;
  /** Radio group name — unique per question within the form. */
  name: string;
  value: number | null;
  onChange: (optionIndex: number) => void;
  questionLabel: string;
  ofLabel: string;
  disabled?: boolean;
};

export function QuizQuestionCard({
  index,
  total,
  question,
  name,
  value,
  onChange,
  questionLabel,
  ofLabel,
  disabled,
}: QuizQuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {questionLabel} {index + 1} {ofLabel} {total}
        </p>
        <CardTitle className="text-base font-medium leading-snug">{question.prompt}</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-2" disabled={disabled}>
          {question.options.map((option, optionIndex) => {
            const id = `${name}-opt-${optionIndex}`;
            const selected = value === optionIndex;
            return (
              <Label
                key={id}
                htmlFor={id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background ${
                  selected
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border font-normal hover:bg-muted/50"
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={name}
                  className="size-4 shrink-0 accent-primary focus-visible:outline-none"
                  checked={selected}
                  onChange={() => onChange(optionIndex)}
                />
                <span>{option}</span>
              </Label>
            );
          })}
        </fieldset>
      </CardContent>
    </Card>
  );
}
