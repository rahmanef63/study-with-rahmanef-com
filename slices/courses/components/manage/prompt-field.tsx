"use client";
// courses slice — THE prompt field. This is the one genuinely new input a
// SKILL needs; everything else about authoring one is the materi form it
// already shares (title, tags, body, publish, delete).
//
// Monospace, because the text is copied verbatim into a chat box and its
// indentation, placeholders and code fences are meaning, not decoration.
//
// The counter is ALWAYS visible and `maxLength` is hard: MAX_PROMPT_CHARS is a
// server bound (assertPromptText → VALIDATION_FAILED), and an author must meet
// it in the form rather than discover it from a rejected save. The number turns
// warning-coloured near the cap so a long prompt announces itself before the
// typing stops dead.
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CoursesCopy } from "../../config/copy";
import { MAX_PROMPT_CHARS } from "../../config/limits";

export type PromptFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  copy: CoursesCopy;
  /** Defaults to the server cap; only tests should pass anything else. */
  max?: number;
  /** A skill without a prompt is a materi — required by default. */
  required?: boolean;
  disabled?: boolean;
};

/** id-ID grouping: 4.000, not 4000 — the counter is read, not parsed. */
const n = (value: number) => value.toLocaleString("id-ID");

export function PromptField({
  id,
  value,
  onChange,
  copy,
  max = MAX_PROMPT_CHARS,
  required = true,
  disabled = false,
}: PromptFieldProps) {
  const used = value.length;
  const nearCap = used >= max * 0.9;
  const counterId = `${id}-counter`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id}>{copy.fieldPrompt}</Label>
        <span
          id={counterId}
          aria-live="polite"
          className={`font-mono text-xs tabular-nums ${
            nearCap ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {n(used)} / {n(max)}
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        required={required}
        disabled={disabled}
        rows={8}
        spellCheck={false}
        aria-describedby={`${counterId} ${id}-hint`}
        placeholder={copy.fieldPromptPlaceholder}
        className="min-h-40 font-mono text-sm leading-relaxed"
      />
      <p id={`${id}-hint`} className="text-pretty text-sm text-muted-foreground">
        {copy.fieldPromptHint}
      </p>
    </div>
  );
}
