// Progress projection for a run — split out of `./run.ts` when that file
// crossed the 200-line ceiling (`npm run audit:file-size`). It is a clean seam,
// not an arbitrary cut: everything here answers ONE question — "how far along
// does the bar say we are" — and nothing in the reducer depends on it. The
// dependency runs one way, `run-progress → run`, so there is no import cycle.
import { questionsFor, situationFieldsFor } from "@/lib/peta";
import { isDone, type RunState } from "./run";

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
