// The run reducer — pure, so the whole deck can be unit-tested without a DOM.
//
// ONE INVARIANT holds everything together: `draft.known` is DERIVED, never
// typed in. It is recomputed from the per-card swipe verdicts intersected with
// the deck the current answers imply, so the failure the engine warns about —
// a stale `known` array surviving a back-navigation and inflating a level —
// cannot be represented here.
//
// Swipe verdicts are kept even for cards that left the deck. Changing "sudah
// setahun" to "belum pernah" and back must not cost seven swipes; the verdicts
// are keyed by concept, and a concept a visitor already judged does not need
// re-judging. `situation` answers are pruned the other way, on purpose: a
// closed branch's value would reach the scorers as an answer to a question
// that was never asked.
import { conceptsFor, nextQuestion, questionsFor, situationFieldsFor } from "@/lib/peta";
import type {
  ConceptId,
  PetaDraft,
  PetaQuestion,
  SituationAnswers,
  Subscription,
} from "@/lib/peta";
import type { SwipeVerdicts } from "./sanitize";

export type RunState = { draft: PetaDraft; swipe: SwipeVerdicts };
export const EMPTY_RUN: RunState = { draft: {}, swipe: {} };

/** One thing the visitor has to do. The swipe question expands into its cards
 *  so a 7-card deck reads as 7 steps of progress, not one. */
export type RunStep =
  | { kind: "question"; question: PetaQuestion }
  | { kind: "card"; id: ConceptId };

export function normalise(state: RunState): RunState {
  const open = new Set<string>(situationFieldsFor(state.draft));
  const situation: Record<string, string> = {};
  for (const [field, value] of Object.entries(state.draft.situation ?? {})) {
    if (open.has(field) && typeof value === "string") situation[field] = value;
  }
  const deck = conceptsFor(state.draft);
  const swiped = deck.every((card) => card.id in state.swipe);
  const known = deck.filter((card) => state.swipe[card.id] === true).map((card) => card.id);

  const draft: PetaDraft = { ...state.draft };
  if (Object.keys(situation).length === 0) delete draft.situation;
  else draft.situation = situation as SituationAnswers;
  if (swiped) draft.known = known;
  else delete draft.known;
  return { draft, swipe: state.swipe };
}

export function setSingle(state: RunState, q: PetaQuestion, value: string): RunState {
  if (q.kind !== "pilih-satu") return state;
  if (q.stage === "situasi") {
    const situation = { ...state.draft.situation, [q.id]: value } as SituationAnswers;
    return normalise({ ...state, draft: { ...state.draft, situation } });
  }
  return normalise({ ...state, draft: { ...state.draft, [q.id]: value } as PetaDraft });
}

export function setMulti(state: RunState, values: readonly string[]): RunState {
  const subscriptions = values as readonly Subscription[];
  return normalise({ ...state, draft: { ...state.draft, subscriptions } });
}

export function setSwipe(state: RunState, id: ConceptId, knows: boolean): RunState {
  return normalise({ ...state, swipe: { ...state.swipe, [id]: knows } });
}

/** Every step this draft implies, in order. */
export function runSteps(state: RunState): RunStep[] {
  const out: RunStep[] = [];
  for (const question of questionsFor(state.draft)) {
    if (question.kind === "geser") {
      for (const card of question.cards) out.push({ kind: "card", id: card.id });
    } else {
      out.push({ kind: "question", question });
    }
  }
  return out;
}

function isDone(state: RunState, step: RunStep): boolean {
  if (step.kind === "card") return step.id in state.swipe;
  const q = step.question;
  if (q.kind === "pilih-banyak") return state.draft.subscriptions !== undefined;
  if (q.stage === "situasi")
    return state.draft.situation?.[q.id as keyof SituationAnswers] !== undefined;
  return state.draft[q.id as "tenure"] !== undefined;
}

function undo(state: RunState, step: RunStep): RunState {
  if (step.kind === "card") {
    const swipe = { ...state.swipe };
    delete swipe[step.id];
    return normalise({ ...state, swipe });
  }
  const q = step.question;
  const draft: PetaDraft = { ...state.draft };
  if (q.kind === "pilih-banyak") delete draft.subscriptions;
  else if (q.stage === "situasi") {
    const situation = { ...draft.situation } as Record<string, string>;
    delete situation[q.id];
    draft.situation = situation as SituationAnswers;
  } else delete draft[q.id as "tenure"];
  return normalise({ ...state, draft });
}

/** Answered steps form a prefix, so "back" is "undo the last done step". */
export function back(state: RunState): RunState {
  const steps = runSteps(state);
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step !== undefined && isDone(state, step)) return undo(state, step);
  }
  return state;
}

/**
 * How many `situation` branches to ASSUME before role, goal and budget are
 * known. Over-counting is the right DIRECTION — a denominator that grows reads
 * as "this is longer than you were promised" and loses people mid-run, while
 * one that shrinks reads as good news.
 *
 * The upper bound over-promises, though: a fresh visitor saw "1 / 11" when the
 * most common persona — the Rp0 office worker this feature exists for —
 * finishes at 7, and the first number they see decides whether they start at
 * all. Lowering the assumption would trade that for a total that GROWS, which
 * is worse. So the bound stays and `provisional` below tells the UI to withhold
 * the denominator until it is true, rather than print a number we know is
 * wrong.
 */
const SITUATION_FIELDS = 4;

export type RunProgress = {
  /** Questions fully answered. The 13-card deck is ONE of them. */
  answered: number;
  /** Projected total. Only ever shrinks as the branches resolve. */
  total: number;
  /** 0–100. Advances smoothly THROUGH the deck, card by card, so the bar
   *  never sits frozen for thirteen screens. */
  pct: number;
  canGoBack: boolean;
  /** `total` is still an upper-bound guess — the branch questions depend on
   *  answers not given yet. Show the bar, not the denominator. */
  provisional: boolean;
};

/**
 * The deck counts as ONE question here, not as thirteen.
 *
 * Counting cards individually was measured and rejected: it made the total
 * jump from 10 to 19 the instant someone answered "lebih dari setahun", which
 * is the first question. A stack of cards with its own "3/13" corner already
 * reads as one activity to the person holding the phone — so the label counts
 * questions and the BAR carries the card-by-card motion.
 */
export function runProgress(state: RunState): RunProgress {
  const questions = questionsFor(state.draft);
  const { role, goal, budget } = state.draft;
  const open = situationFieldsFor(state.draft).length;
  const branchesKnown = role !== undefined && goal !== undefined && budget !== undefined;
  const total = questions.length - open + (branchesKnown ? open : SITUATION_FIELDS);

  let answered = 0;
  let deckFraction = 0;
  for (const question of questions) {
    if (question.kind === "geser") {
      const done = question.cards.filter((card) => card.id in state.swipe).length;
      if (done === question.cards.length) answered++;
      else if (question.cards.length > 0) deckFraction = done / question.cards.length;
    } else if (isDone(state, { kind: "question", question })) {
      answered++;
    }
  }
  const pct =
    total === 0 ? 0 : Math.min(100, Math.round(((answered + deckFraction) / total) * 100));
  return {
    answered,
    total,
    pct,
    canGoBack: answered > 0 || deckFraction > 0,
    provisional: !branchesKnown,
  };
}

/** The question on screen, or null when the run is finished. */
export function currentQuestion(state: RunState): PetaQuestion | null {
  return nextQuestion(state.draft);
}

/**
 * Rebuild a full run from a bare draft — how a shared `?p=` link becomes an
 * editable run. The per-card verdicts are reconstructed from `known`, so the
 * recipient can hit Back into the deck and change an answer instead of being
 * stuck with a read-only copy of somebody else's result.
 */
export function runFromDraft(draft: PetaDraft): RunState {
  const swipe: SwipeVerdicts = {};
  if (draft.known !== undefined) {
    const known = new Set<string>(draft.known);
    for (const card of conceptsFor(draft)) swipe[card.id] = known.has(card.id);
  }
  return normalise({ draft, swipe });
}
