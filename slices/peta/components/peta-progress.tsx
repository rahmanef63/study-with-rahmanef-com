"use client";
// The "how much is left" strip. Two jobs, and the second one is the important
// one: a questionnaire with no visible end is one people abandon, so the
// remaining count is spelled out as a NUMBER, not implied by a bar.
//
// The denominator is a PROJECTION that can only shrink (see runProgress). It
// counts questions, so the thirteen-card deck is one of them; the bar is what
// carries the card-by-card motion, which is why `pct` is passed separately
// instead of being derived from answered/total here.
import { ChevronLeft } from "lucide-react";

export type PetaProgressProps = {
  /** Questions fully answered. */
  answered: number;
  /** Projected total. */
  total: number;
  /** 0–100, already accounting for progress inside the deck. */
  pct: number;
  /** Where they are — "Kenalan", "Modal & waktu", … the arcade eyebrow. */
  stage: string;
  canGoBack: boolean;
  /** `total` is still an upper bound — print the position alone until it is real. */
  provisional: boolean;
  onBack: () => void;
};

export function PetaProgress({
  answered,
  total,
  pct,
  stage,
  canGoBack,
  provisional,
  onBack,
}: PetaProgressProps) {
  const position = Math.min(answered + 1, total);
  return (
    <div className="space-y-2">
      <div className="flex min-h-11 items-center gap-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-footnote text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Kembali
          </button>
        ) : null}
        {/* Stage and counter TOGETHER on the right. They used to be exclusive
            with the back button, so the four stage names the questionnaire is
            organised around were visible on question one and never again — the
            structure existed only in the code. The row is min-h-11 and holds
            three short items comfortably at 390px. */}
        <span className="ml-auto flex items-baseline gap-2 text-footnote text-muted-foreground tabular-nums">
          <span className="eyebrow">{stage}</span>
          <span aria-hidden>·</span>
          {/* The denominator is an UPPER BOUND until role, goal and budget are
              known — it said "1 / 11" to someone whose run is really 7 long,
              and the first number a stranger sees decides whether they start.
              Lowering the guess would make the total grow instead, which reads
              as a broken promise. So: withhold it, keep the bar. */}
          <span>{provisional ? `Pertanyaan ${position}` : `${position} / ${total}`}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Kemajuan peta belajar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={
          provisional
            ? `Pertanyaan ${position}, ${pct} persen`
            : `Pertanyaan ${position} dari ${total}, ${pct} persen`}
        className="h-2 w-full border-2 border-border bg-muted"
      >
        {/* steps(), not ease: a cabinet meter ticks. `motion-reduce` turns even
            that off — the width still changes, it just stops animating. */}
        <div
          className="h-full bg-primary transition-[width] duration-150 [transition-timing-function:steps(4,end)] motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
