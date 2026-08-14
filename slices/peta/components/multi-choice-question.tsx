"use client";
// "Pilih-banyak" — the subscriptions question, and the only one in the run
// that needs a confirm step.
//
// Toggles here ARE checkboxes semantically (`aria-pressed` on a button is the
// closest native match for "on/off, many allowed"), because unlike the
// single-choice card there is a state to review before moving on.
//
// The `exclusive` option ("Belum langganan apa pun") is enforced in BOTH
// directions: picking it clears everything else, and picking anything else
// clears it. Leaving both selectable would produce "I subscribe to nothing and
// also to ChatGPT Plus", which the budget advice would then have to guess at.
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MultiChoiceQuestion as MultiQuestion } from "@/lib/peta";

export type MultiChoiceQuestionProps = {
  question: MultiQuestion;
  value?: readonly string[];
  onSubmit: (values: readonly string[]) => void;
};

export function MultiChoiceQuestion({ question, value, onSubmit }: MultiChoiceQuestionProps) {
  const [picked, setPicked] = useState<readonly string[]>(value ?? []);

  const toggle = (option: string) => {
    setPicked((prev) => {
      if (option === question.exclusive) return prev.includes(option) ? [] : [option];
      const without = prev.filter((v) => v !== option && v !== question.exclusive);
      return prev.includes(option) ? without : [...without, option];
    });
  };

  return (
    <div>
      <h2 className="text-balance font-sans text-headline font-medium normal-case tracking-normal">
        {question.prompt}
      </h2>
      {question.help ? (
        <p className="mt-3 text-pretty text-footnote text-muted-foreground">{question.help}</p>
      ) : null}
      <ul className="mt-5 grid gap-2">
        {question.options.map((option) => {
          const on = picked.includes(option.value);
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option.value)}
                className={`flex min-h-14 w-full items-center gap-3 border px-4 py-3 text-left transition-colors duration-75 [transition-timing-function:steps(2,end)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                  on
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:border-primary hover:text-primary"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {on ? <Check className="size-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1 text-title font-medium">{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        size="lg"
        // Empty is a legal answer only via the exclusive option, so an empty
        // pick submits "none" rather than blocking the run on a technicality.
        onClick={() => onSubmit(picked.length === 0 ? [question.exclusive] : picked)}
        className="mt-5 min-h-12 w-full"
      >
        Lanjut
      </Button>
    </div>
  );
}
