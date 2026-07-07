"use client";
// quiz slice — one question editor for the builder (prompt, 2–6 options, the
// correct-answer key via radio, optional explanation). Controlled: the parent
// form owns the questions array and passes onChange/onRemove.
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizCopy } from "../config/copy";
import { MAX_OPTIONS, MAX_OPTION_CHARS, MAX_PROMPT_CHARS, MIN_OPTIONS } from "../config/limits";
import type { QuizQuestionInput } from "../types";

export type QuizQuestionEditorProps = {
  index: number;
  question: QuizQuestionInput;
  onChange: (next: QuizQuestionInput) => void;
  onRemove: () => void;
  canRemove: boolean;
  copy: QuizCopy;
};

export function QuizQuestionEditor({ index, question, onChange, onRemove, canRemove, copy }: QuizQuestionEditorProps) {
  const name = `q-${index}-correct`;

  const setOption = (optionIndex: number, text: string) => {
    const options = question.options.map((o, i) => (i === optionIndex ? text : o));
    onChange({ ...question, options });
  };
  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) return;
    onChange({ ...question, options: [...question.options, ""] });
  };
  const removeOption = (optionIndex: number) => {
    if (question.options.length <= MIN_OPTIONS) return;
    const options = question.options.filter((_, i) => i !== optionIndex);
    // keep correctIndex valid after removal
    let correctIndex = question.correctIndex;
    if (optionIndex === correctIndex) correctIndex = 0;
    else if (optionIndex < correctIndex) correctIndex -= 1;
    onChange({ ...question, options, correctIndex });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 @sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span
            aria-hidden
            className="font-serif text-xl leading-none tabular-nums text-primary/70"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <Label htmlFor={`${name}-prompt`} className="text-sm font-semibold">
            {copy.fieldPrompt}
          </Label>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 shrink-0 text-muted-foreground hover:text-destructive @sm:min-h-9"
            onClick={onRemove}
            aria-label={copy.removeQuestion}
          >
            <Trash2 className="size-4" aria-hidden />
            <span className="hidden @sm:inline">{copy.removeQuestion}</span>
          </Button>
        )}
      </div>
      <Input
        id={`${name}-prompt`}
        value={question.prompt}
        onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        placeholder={copy.fieldPrompt}
        required
        minLength={3}
        maxLength={MAX_PROMPT_CHARS}
      />

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs text-muted-foreground">
          {copy.markCorrect}
        </legend>
        {question.options.map((option, optionIndex) => (
          <div
            key={optionIndex}
            className={`flex items-center gap-2 rounded-md p-1.5 transition-colors ${
              question.correctIndex === optionIndex ? "bg-primary/5" : ""
            }`}
          >
            <input
              type="radio"
              name={name}
              className="size-4 shrink-0 cursor-pointer accent-primary"
              aria-label={`${copy.correctKey} ${optionIndex + 1}`}
              checked={question.correctIndex === optionIndex}
              onChange={() => onChange({ ...question, correctIndex: optionIndex })}
            />
            <Input
              className="min-w-0 flex-1"
              value={option}
              onChange={(e) => setOption(optionIndex, e.target.value)}
              placeholder={`${copy.option} ${optionIndex + 1}`}
              required
              maxLength={MAX_OPTION_CHARS}
            />
            {question.options.length > MIN_OPTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 @sm:size-9"
                onClick={() => removeOption(optionIndex)}
                aria-label={copy.removeOption}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        ))}
        {question.options.length < MAX_OPTIONS && (
          <Button type="button" variant="outline" size="sm" className="min-h-11 @sm:min-h-8" onClick={addOption}>
            <Plus className="size-4" aria-hidden /> {copy.addOption}
          </Button>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor={`${name}-exp`} className="text-xs text-muted-foreground">
          {copy.fieldExplanation}
        </Label>
        <textarea
          id={`${name}-exp`}
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
