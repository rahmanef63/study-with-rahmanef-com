// The run reducer. These specs are the contract for the deck's behaviour, and
// three of them exist because of a specific hazard the engine warned about.
import { describe, expect, test } from "vitest";
import {
  assess,
  conceptsFor,
  isComplete,
  nextQuestion,
  questionsFor,
  type PetaDraft,
} from "@/lib/peta";
import {
  back,
  currentQuestion,
  EMPTY_RUN,
  normalise,
  runFromDraft,
  runProgress,
  runSteps,
  setMulti,
  setSingle,
  setSwipe,
  type RunState,
} from "../lib/run";

/** Answer whatever is on screen with its FIRST option until the run ends. */
function autoplay(start: RunState = EMPTY_RUN, pick = 0): RunState {
  let state = start;
  for (let guard = 0; guard < 60; guard++) {
    const q = currentQuestion(state);
    if (q === null) return state;
    if (q.kind === "geser") {
      const card = q.cards.find((c) => !(c.id in state.swipe));
      if (card === undefined) throw new Error("deck says incomplete but every card is answered");
      state = setSwipe(state, card.id, false);
    } else if (q.kind === "pilih-banyak") {
      state = setMulti(state, [q.options[pick]?.value ?? "none"]);
    } else {
      state = setSingle(state, q, q.options[Math.min(pick, q.options.length - 1)]!.value);
    }
  }
  throw new Error("run did not terminate");
}

describe("a whole run", () => {
  test("terminates, and the draft it produces is what the engine calls complete", () => {
    const state = autoplay();
    expect(currentQuestion(state)).toBeNull();
    expect(isComplete(state.draft)).toBe(true);
    // The point of the whole slice: this draft can be scored.
    expect(() => assess(state.draft as never)).not.toThrow();
  });

  test("the percentage never goes backwards and lands exactly on 100", () => {
    let state = EMPTY_RUN;
    let last = -1;
    for (let guard = 0; guard < 60; guard++) {
      const { pct, answered, total } = runProgress(state);
      expect(pct).toBeGreaterThanOrEqual(last);
      expect(pct).toBeLessThanOrEqual(100);
      expect(answered).toBeLessThanOrEqual(total);
      last = pct;
      if (currentQuestion(state) === null) break;
      state = autoplayOne(state);
    }
    const end = runProgress(state);
    expect(end.pct).toBe(100);
    expect(end.answered).toBe(end.total);
    expect(end.total).toBe(questionsFor(state.draft).length);
  });

  test("THE DENOMINATOR ONLY SHRINKS — a growing total reads as a broken promise", () => {
    // Measured regression: counting each of the 13 cards as a step made the
    // total jump 10 → 19 on the very first answer.
    for (const picks of [0, 1, 2, 3, 5, 8]) {
      let state = EMPTY_RUN;
      let previous = Infinity;
      for (let guard = 0; guard < 60; guard++) {
        const { total } = runProgress(state);
        expect(total).toBeLessThanOrEqual(previous);
        previous = total;
        if (currentQuestion(state) === null) break;
        state = autoplayOne(state, picks);
      }
    }
  });

  test("the bar advances INSIDE the deck, card by card, instead of freezing", () => {
    let state = EMPTY_RUN;
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    const deck = conceptsFor(state.draft);
    const start = runProgress(state);
    const seen = new Set<number>([start.pct]);
    for (const card of deck) {
      state = setSwipe(state, card.id, false);
      seen.add(runProgress(state).pct);
    }
    // The whole deck is ONE question in the label…
    expect(runProgress(state).answered).toBe(start.answered + 1);
    // …but the bar moved several times while it was being answered.
    expect(seen.size).toBeGreaterThan(2);
  });

  test("canGoBack is false on the very first screen and true after one answer", () => {
    expect(runProgress(EMPTY_RUN).canGoBack).toBe(false);
    const q = currentQuestion(EMPTY_RUN)!;
    expect(q.kind).toBe("pilih-satu");
    const after = setSingle(EMPTY_RUN, q, "never");
    expect(runProgress(after).canGoBack).toBe(true);
  });

  test("canGoBack is true one card into the deck, so the card is undoable", () => {
    let state = EMPTY_RUN;
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    expect(runProgress(setSwipe(state, conceptsFor(state.draft)[0]!.id, true)).canGoBack).toBe(true);
  });
});

function autoplayOne(state: RunState, pick = 0): RunState {
  const q = currentQuestion(state);
  if (q === null) return state;
  if (q.kind === "geser") {
    const card = q.cards.find((c) => !(c.id in state.swipe))!;
    return setSwipe(state, card.id, false);
  }
  if (q.kind === "pilih-banyak") return setMulti(state, [q.options[pick % q.options.length]!.value]);
  return setSingle(state, q, q.options[pick % q.options.length]!.value);
}

describe("back", () => {
  test("is a true inverse of the last answer, one step at a time", () => {
    const seen: RunState[] = [EMPTY_RUN];
    let state = EMPTY_RUN;
    for (let i = 0; i < 6; i++) {
      state = autoplayOne(state);
      seen.push(state);
    }
    for (let i = seen.length - 1; i > 0; i--) {
      state = back(state);
      expect(state.draft).toEqual(seen[i - 1]!.draft);
    }
    expect(state).toEqual(EMPTY_RUN);
  });

  test("inside the deck it undoes ONE CARD, not the whole deck", () => {
    let state = EMPTY_RUN;
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    const deck = conceptsFor(state.draft);
    state = setSwipe(state, deck[0]!.id, true);
    state = setSwipe(state, deck[1]!.id, false);
    const undone = back(state);
    expect(deck[1]!.id in undone.swipe).toBe(false);
    expect(undone.swipe[deck[0]!.id]).toBe(true);
  });

  test("at the very start it is a no-op rather than a throw", () => {
    expect(back(EMPTY_RUN)).toEqual(EMPTY_RUN);
  });
});

describe("the derived-known invariant", () => {
  test("`known` does not exist until every card in the CURRENT deck is judged", () => {
    let state = EMPTY_RUN;
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    const deck = conceptsFor(state.draft);
    for (const card of deck.slice(0, -1)) state = setSwipe(state, card.id, true);
    expect(state.draft.known).toBeUndefined();
    state = setSwipe(state, deck.at(-1)!.id, true);
    expect(state.draft.known).toEqual(deck.map((c) => c.id));
  });

  test("shrinking the deck cannot leave a stale `known` behind — the hazard the engine names", () => {
    // A veteran developer gets the full 13-card deck and knows all of it.
    let state = EMPTY_RUN;
    state = setSingle(state, currentQuestion(state)!, "over1y");
    state = setSingle(state, currentQuestion(state)!, "developer");
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    for (const card of conceptsFor(state.draft)) state = setSwipe(state, card.id, true);
    expect(state.draft.known).toHaveLength(13);

    // They go back and change tenure to "never". Both upper tiers stay open,
    // because `developer` opens them on its own — the deck does not shrink here.
    // `known` must still track `conceptsFor` exactly, or the level scorer counts
    // cards this configuration never asked.
    const tenureQ = questionsFor(state.draft).find((q) => q.kind !== "geser" && q.id === "tenure")!;
    state = setSingle(state, tenureQ, "never");
    expect(state.draft.known).toEqual(conceptsFor(state.draft).map((c) => c.id));
    expect(state.draft.known).toContain("few-shot");
    expect(state.draft.known).toContain("mcp");
    expect(state.draft.known).toHaveLength(13);

    // Now close the advanced tiers for real, by leaving the developer branch.
    const roleQ = questionsFor(state.draft).find((q) => q.kind !== "geser" && q.id === "role")!;
    state = setSingle(state, roleQ, "office");
    expect(state.draft.known).toEqual(conceptsFor(state.draft).map((c) => c.id));
    expect(state.draft.known).not.toContain("few-shot");
    expect(state.draft.known).toHaveLength(4);
  });

  test("verdicts SURVIVE a deck that shrinks and re-expands — no re-swiping", () => {
    let state = EMPTY_RUN;
    state = setSingle(state, currentQuestion(state)!, "over1y");
    state = setSingle(state, currentQuestion(state)!, "developer");
    while (currentQuestion(state)?.kind !== "geser") state = autoplayOne(state);
    for (const card of conceptsFor(state.draft)) state = setSwipe(state, card.id, true);

    const tenureQ = questionsFor(state.draft).find((q) => q.kind !== "geser" && q.id === "tenure")!;
    const narrowed = setSingle(state, tenureQ, "never");
    const widened = setSingle(narrowed, tenureQ, "over1y");
    expect(widened.draft.known).toHaveLength(13);
    expect(currentQuestion(widened)?.kind).not.toBe("geser");
  });
});

describe("situation pruning", () => {
  test("an answer whose branch closes is dropped, so the scorers never read it", () => {
    // budget != zero opens spendPriority.
    let state = EMPTY_RUN;
    state = setSingle(state, currentQuestion(state)!, "never"); // tenure
    state = setSingle(state, currentQuestion(state)!, "office"); // role
    state = setSingle(state, currentQuestion(state)!, "save-time"); // goal
    const budgetQ = currentQuestion(state)!;
    state = setSingle(state, budgetQ, "over300k");
    while (currentQuestion(state)?.stage !== "situasi") state = autoplayOne(state);
    state = setSingle(state, currentQuestion(state)!, "cheapest");
    expect(state.draft.situation?.spendPriority).toBe("cheapest");

    // Rp0 closes that branch outright.
    const closed = setSingle(state, budgetQ, "zero");
    expect(closed.draft.situation).toBeUndefined();
  });
});

describe("normalise / runFromDraft", () => {
  test("normalise is idempotent", () => {
    const state = autoplay();
    expect(normalise(normalise(state))).toEqual(normalise(state));
  });

  test("runFromDraft rebuilds per-card verdicts so a shared plan stays editable", () => {
    const finished = autoplay(EMPTY_RUN, 3);
    const rebuilt = runFromDraft(finished.draft as PetaDraft);
    expect(rebuilt.draft).toEqual(finished.draft);
    expect(Object.keys(rebuilt.swipe).sort()).toEqual(
      conceptsFor(finished.draft).map((c) => c.id).sort()
    );
    // …and Back walks all the way into the deck rather than dead-ending on
    // the last question: a recipient can change one card, not just re-read.
    let state = rebuilt;
    for (let guard = 0; guard < 60 && currentQuestion(state)?.kind !== "geser"; guard++) {
      state = back(state);
    }
    expect(currentQuestion(state)?.kind).toBe("geser");
    expect(Object.keys(state.swipe).length).toBeLessThan(Object.keys(rebuilt.swipe).length);
  });

  test("an empty draft asks the engine's first question and nothing else", () => {
    expect(currentQuestion(EMPTY_RUN)).toEqual(nextQuestion({}));
    // runSteps is the UNDO ladder, so it expands the deck into cards; the
    // PROGRESS label counts questions. The two are deliberately different
    // numbers and this pins the relationship between them.
    const steps = runSteps(EMPTY_RUN);
    const questions = questionsFor(EMPTY_RUN.draft);
    expect(steps.length).toBe(questions.length - 1 + conceptsFor(EMPTY_RUN.draft).length);
    expect(runProgress(EMPTY_RUN).total).toBeGreaterThanOrEqual(questions.length);
  });
});
