"use client";
// /mulai, client half. Three states and nothing else: not-hydrated-yet, a
// question, the plan.
//
// FULLY ANONYMOUS, by law (DECISIONS #34). No session is read to decide what
// to render, no login is ever prompted, and the only network call in the whole
// flow is the optional fire-and-forget profile write for someone who was
// ALREADY signed in. The plan itself is arithmetic.
//
// The not-ready frame exists because the answers live in localStorage, which a
// server component cannot see: rendering question 1 and then jumping to
// question 9 a tick later is how you tell a returning visitor their progress
// was lost, right before it visibly is not.
import { useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PetaStageId, SituationAnswers } from "@/lib/peta";
import { ChoiceQuestion } from "../components/choice-question";
import { MultiChoiceQuestion } from "../components/multi-choice-question";
import { PetaProgress } from "../components/peta-progress";
import { SwipeQuestion } from "../components/swipe-question";
import { usePetaRun } from "../hooks/use-peta-run";
import { decodeRun } from "../lib/code";
import type { LiveCatalogue } from "../types";
import { PetaResultView } from "./peta-result-view";

const STAGE_LABEL: Record<PetaStageId, string> = {
  kenalan: "Kenalan",
  modal: "Modal & waktu",
  pengetahuan: "Yang kamu tahu",
  situasi: "Situasimu",
};

export type PetaViewProps = {
  catalogue: LiveCatalogue;
  /** `?p=` from the URL — a plan someone shared. */
  sharedCode?: string;
};

export function PetaView({ catalogue, sharedCode }: PetaViewProps) {
  const sharedDraft = useMemo(
    () => (sharedCode === undefined ? null : decodeRun(sharedCode)),
    [sharedCode]
  );
  const run = usePetaRun(sharedDraft);

  if (!run.ready) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (run.answers !== null) {
    return (
      <PetaResultView
        answers={run.answers}
        catalogue={catalogue}
        onBack={run.back}
        onReset={run.reset}
      />
    );
  }

  const question = run.question;
  if (question === null) return null; // unreachable: null question ⇒ complete

  return (
    <div className="space-y-5">
      <PetaProgress
        answered={run.progress.answered}
        total={run.progress.total}
        pct={run.progress.pct}
        stage={STAGE_LABEL[question.stage]}
        canGoBack={run.progress.canGoBack}
        provisional={run.progress.provisional}
        onBack={run.back}
      />
      <QuestionFrame question={question}>
      {question.kind === "pilih-satu" ? (
        <ChoiceQuestion
          question={question}
          value={
            question.stage === "situasi"
              ? run.state.draft.situation?.[question.id as keyof SituationAnswers]
              : run.state.draft[question.id as "tenure"]
          }
          onPick={(value) => run.answerSingle(question, value)}
        />
      ) : null}
      {question.kind === "pilih-banyak" ? (
        <MultiChoiceQuestion
          question={question}
          value={run.state.draft.subscriptions}
          onSubmit={run.answerMulti}
        />
      ) : null}
      {question.kind === "geser" ? (
        <SwipeQuestion
          question={question}
          swipe={run.state.swipe}
          onDecide={run.answerSwipe}
        />
      ) : null}
      </QuestionFrame>
    </div>
  );
}

/**
 * Moves focus to the new question and gives it an accessible name.
 *
 * Answering advances immediately, so the DOM under the progress bar is replaced
 * while focus sits on a button that no longer exists — the browser drops focus
 * to <body>. A keyboard user then Tabs past the header, the Kembali button and
 * the progress bar on EVERY question, and a screen-reader user hears nothing at
 * all. Six of the eleven steps are these tap questions, on the one page written
 * to welcome a stranger.
 *
 * Focus movement IS the announcement here — the group is labelled with the
 * prompt, so landing on it reads the new question aloud. A separate aria-live
 * region would say the same words a second time; the swipe deck has one because
 * there the CARD changes underneath a focus that legitimately stays put.
 */
function QuestionFrame({
  question,
  children,
}: {
  question: { id: string; prompt: string };
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { id } = question;
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [id]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-label={question.prompt}
      className="outline-none"
    >
      {children}
    </div>
  );
}
