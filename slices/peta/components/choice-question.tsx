"use client";
// Tap-to-answer option rows — the "pilih-satu" card.
//
// Buttons, not radios, and that is a deliberate a11y call: choosing an option
// IMMEDIATELY advances, so there is no state to review and no submit to press.
// A radiogroup promises "pick, then confirm"; a screen reader user would sit
// on a group waiting for a Lanjut button that never comes. Buttons announce
// exactly what happens — activate and move on.
//
// Rows are 56px, well over the 44px floor, because this is the surface a
// stranger meets first and the whole feature dies if a thumb misses.
import type { PetaOption, SingleChoiceQuestion } from "@/lib/peta";

export type ChoiceQuestionProps = {
  question: SingleChoiceQuestion;
  /** The value already chosen, when they came BACK to this question. */
  value?: string;
  onPick: (value: string) => void;
};

export function ChoiceQuestion({ question, value, onPick }: ChoiceQuestionProps) {
  return (
    <div>
      <h2 className="text-balance font-sans text-headline font-medium normal-case tracking-normal">
        {question.prompt}
      </h2>
      {question.help ? (
        <p className="mt-3 text-pretty text-footnote text-muted-foreground">{question.help}</p>
      ) : null}
      <ul className="mt-5 grid gap-2">
        {question.options.map((option: PetaOption) => {
          const active = option.value === value;
          return (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => onPick(option.value)}
                aria-current={active ? "true" : undefined}
                className={`flex min-h-14 w-full items-center gap-3 border px-4 py-3 text-left transition-colors duration-75 [transition-timing-function:steps(2,end)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-card hover:border-primary hover:text-primary"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-title font-medium">{option.label}</span>
                  {option.hint ? (
                    <span className="block text-caption text-muted-foreground">{option.hint}</span>
                  ) : null}
                </span>
                <span aria-hidden className="list-chevron shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
