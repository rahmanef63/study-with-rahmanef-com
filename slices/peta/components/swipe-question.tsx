"use client";
// The deck. Owns everything around the card: the live region, the two buttons,
// the peek of the next card, and the reduced-motion branch.
//
// The card element is deliberately NOT keyed by concept, so answering does not
// remount it. That is an accessibility decision, not a performance one: a
// remount destroys the focused node, dumping a keyboard user back on <body>
// after every single card. Same node, new content, focus stays put — and the
// aria-live region below announces what just changed.
import { Check, X } from "lucide-react";
import type { ConceptId, SwipeQuestion as SwipeQuestionType } from "@/lib/peta";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import type { SwipeVerdicts } from "../lib/sanitize";
import { SwipeCard } from "./swipe-card";

export type SwipeQuestionProps = {
  question: SwipeQuestionType;
  swipe: SwipeVerdicts;
  onDecide: (id: ConceptId, knows: boolean) => void;
};

const VERDICT = "flex min-h-14 flex-1 items-center justify-center gap-2 border px-4 text-title font-medium uppercase tracking-wide transition-colors duration-75 [transition-timing-function:steps(2,end)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function SwipeQuestion({ question, swipe, onDecide }: SwipeQuestionProps) {
  const reducedMotion = useReducedMotion();
  const cards = question.cards;
  const index = cards.findIndex((card) => !(card.id in swipe));
  const card = index === -1 ? undefined : cards[index];
  if (card === undefined) return null; // deck finished; the run advances

  const next = cards[index + 1];
  return (
    <div>
      <h2 className="text-balance font-sans text-headline font-medium normal-case tracking-normal">
        {question.prompt}
      </h2>
      {question.help ? (
        <p className="mt-3 text-pretty text-footnote text-muted-foreground">{question.help}</p>
      ) : null}

      {/* `-mx-4 px-4` puts the clip boundary on the SCREEN edge rather than on
          the reading column, so a dragged card slides off the phone exactly as
          it should. `overflow-x-clip` (never `hidden`) is what stops the drag
          from widening the document and spawning a horizontal scrollbar —
          measured at 390px: a 80px drag grew the page to 460px. `clip` is the
          one value that may differ per axis, so vertical stays visible. */}
      <div className="-mx-4 mt-5 overflow-x-clip px-4">
        {/* The inner box is the positioning context: putting `relative` on the
            padded wrapper instead would measure the ghost card's inset from
            the screen edge rather than from the card, and the peek offset
            would be wrong by the gutter. */}
        <div className="relative">
          {/* The card behind. Purely a depth cue — it tells a thumb the deck
              has more in it, which is what stops the run feeling endless. */}
          {next !== undefined ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-2 h-full border border-border/60 bg-card/50"
            />
          ) : null}
          <SwipeCard
            card={card}
            position={index + 1}
            total={cards.length}
            reducedMotion={reducedMotion}
            onDecide={(knows) => onDecide(card.id, knows)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onDecide(card.id, false)}
          className={`${VERDICT} border-border bg-card hover:border-destructive hover:text-destructive-text`}
        >
          <X className="size-4" aria-hidden />
          Belum
        </button>
        <button
          type="button"
          onClick={() => onDecide(card.id, true)}
          className={`${VERDICT} border-border bg-card hover:border-success hover:text-success`}
        >
          <Check className="size-4" aria-hidden />
          Tahu
        </button>
      </div>

      <p className="mt-3 text-center text-caption text-muted-foreground">
        {reducedMotion
          ? "Pakai tombol di atas, atau panah kiri/kanan."
          : "Geser kartunya, pakai tombol, atau panah kiri/kanan."}
      </p>

      {/* Screen-reader narration. Separate from the card's own label so the
          change is ANNOUNCED even when focus never moved (button presses). */}
      <p aria-live="polite" className="sr-only">
        {`Kartu ${index + 1} dari ${cards.length}: ${card.title}. ${card.blurb}`}
      </p>
    </div>
  );
}
