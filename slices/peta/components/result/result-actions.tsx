"use client";
// Share and retake.
//
// SHARING A PLAN WITHOUT A DATABASE: the assessment is a pure function of the
// answers, so the answers ARE the plan. `?p=<token string>` reproduces this
// exact screen on any device, with nothing stored server-side and no row to
// pay for. Anyone who opens it can also hit Back into the deck and make it
// their own run.
//
// RETAKING is two taps, not one. `reset()` erases a run the visitor spent real
// effort on, and an accidental brush of a single button on a 390px screen
// would be unrecoverable — so the button asks first, inline, without pulling
// in a dialog for one question.
import { useState } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { absoluteUrl } from "@/lib/site";
import { PETA_CODE_PARAM } from "../../lib/code";

export type ResultActionsProps = {
  /** Encoded answers — the shareable half of the URL. */
  code: string;
  headline: string;
  /** Step back into the run — undoes the last answer and reopens the deck. */
  onBack: () => void;
  onReset: () => void;
};

export function ResultActions({ code, headline, onBack, onReset }: ResultActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const url = absoluteUrl(`/mulai?${PETA_CODE_PARAM}=${encodeURIComponent(code)}`);

  return (
    <section className="flex flex-wrap items-center gap-3 border-t-2 border-border pt-5">
      <TombolBagikan
        url={url}
        title="Peta belajar AI-ku"
        text={headline}
        variant="outline"
        className="min-h-11"
      />
      {/* EDIT, not just RETAKE. Someone who opened a shared `?p=` link is
          looking at a plan built from somebody else's answers; one tap puts
          them back on the last question with everything else intact, which is
          the difference between a shareable plan and a screenshot. */}
      <Button type="button" variant="ghost" className="min-h-11 gap-1.5" onClick={onBack}>
        <ChevronLeft className="size-3.5" aria-hidden />
        Ubah jawaban
      </Button>
      {confirming ? (
        <>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            onClick={() => {
              setConfirming(false);
              onReset();
            }}
          >
            Ya, ulangi
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setConfirming(false)}
          >
            Batal
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 gap-1.5"
          onClick={() => setConfirming(true)}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Ulangi tes
        </Button>
      )}
    </section>
  );
}
