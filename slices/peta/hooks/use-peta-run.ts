"use client";
// The run, as React sees it. All the logic is in ../lib/run (pure); this hook
// owns exactly three things the reducer cannot: hydration, persistence, and
// the "not ready yet" frame.
//
// HYDRATION ORDER, and it matters: a `?p=` share link WINS over whatever is in
// localStorage. Someone who was handed a plan opened that URL to see THAT
// plan; showing them their own abandoned run instead would look like the link
// was broken. Their own run is not destroyed — it is simply not shown, and the
// next mirror write only happens once they change something.
import { useCallback, useEffect, useRef, useState } from "react";
import { isComplete } from "@/lib/peta";
import type { ConceptId, PetaAnswers, PetaDraft, PetaQuestion } from "@/lib/peta";
import {
  back as backOne,
  currentQuestion,
  EMPTY_RUN,
  normalise,
  runFromDraft,
  runProgress,
  setMulti,
  setSingle,
  setSwipe,
  type RunProgress,
  type RunState,
} from "../lib/run";
import { clearRun, loadRun, saveRun } from "../lib/storage";

export type PetaRun = {
  /** False for the first client frame only — localStorage is not readable
   *  during SSR, and rendering question 1 before the mirror loads would flash
   *  the wrong screen at every returning visitor. */
  ready: boolean;
  state: RunState;
  question: PetaQuestion | null;
  /** Non-null exactly when `question` is null. */
  answers: PetaAnswers | null;
  progress: RunProgress;
  answerSingle: (question: PetaQuestion, value: string) => void;
  answerMulti: (values: readonly string[]) => void;
  answerSwipe: (id: ConceptId, knows: boolean) => void;
  back: () => void;
  reset: () => void;
};

export function usePetaRun(sharedDraft: PetaDraft | null): PetaRun {
  const [state, setState] = useState<RunState | null>(null);
  // The exact state object a share link produced. While `state` is still that
  // object, the mirror is NOT written — opening somebody else's plan must not
  // overwrite the run you left half-finished on your own phone. The moment the
  // recipient answers anything, a new object appears and saving resumes: the
  // plan has become theirs, which is the point.
  const shared = useRef<RunState | null>(null);

  useEffect(() => {
    if (sharedDraft !== null && Object.keys(sharedDraft).length > 0) {
      const next = runFromDraft(sharedDraft);
      shared.current = next;
      setState(next);
      return;
    }
    // normalise, not trust: the mirror is user-writable, and the derived-known
    // invariant has to hold before the first render reads it.
    setState(normalise(loadRun()));
  }, [sharedDraft]);

  useEffect(() => {
    if (state === null || state === shared.current) return;
    saveRun(state);
  }, [state]);

  const answerSingle = useCallback((question: PetaQuestion, value: string) => {
    setState((prev) => setSingle(prev ?? EMPTY_RUN, question, value));
  }, []);
  const answerMulti = useCallback((values: readonly string[]) => {
    setState((prev) => setMulti(prev ?? EMPTY_RUN, values));
  }, []);
  const answerSwipe = useCallback((id: ConceptId, knows: boolean) => {
    setState((prev) => setSwipe(prev ?? EMPTY_RUN, id, knows));
  }, []);
  const back = useCallback(() => {
    setState((prev) => backOne(prev ?? EMPTY_RUN));
  }, []);
  const reset = useCallback(() => {
    clearRun();
    setState(EMPTY_RUN);
  }, []);

  const current = state ?? EMPTY_RUN;
  const question = currentQuestion(current);
  return {
    ready: state !== null,
    state: current,
    question,
    answers: question === null && isComplete(current.draft) ? current.draft : null,
    progress: runProgress(current),
    answerSingle,
    answerMulti,
    answerSwipe,
    back,
    reset,
  };
}
