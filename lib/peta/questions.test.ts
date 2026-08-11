// The adaptation is the product, not a nicety: asking a beginner about RAG is
// how you make someone quit. These tests pin the exact deck each stage-1 answer
// produces, and prove a beginner's run is strictly shorter than a veteran's.
import { describe, expect, it } from "vitest";
import { CONCEPTS, conceptsFor, isComplete, nextQuestion, progress, questionsFor, situationFieldsFor } from "./index";
import type { PetaAnswers, PetaDraft } from "./index";

const deckIds = (draft: PetaDraft) => conceptsFor(draft).map((c) => c.id);

/** One "step" a human takes: a question, or a single swipe card. */
function stepCount(draft: PetaDraft): number {
  return questionsFor(draft).reduce((n, q) => n + (q.kind === "geser" ? q.cards.length : 1), 0);
}

describe("stage 3 adapts to stage 1", () => {
  it("gives everyone the four basics and nothing else by default", () => {
    expect(deckIds({})).toEqual(["prompt", "hallucination", "context-window", "data-privacy"]);
    expect(deckIds({ tenure: "never", role: "student" })).toHaveLength(4);
    expect(deckIds({ tenure: "under3m", role: "office" })).toHaveLength(4);
  });

  it("unlocks the intermediate tier from three months in", () => {
    expect(deckIds({ tenure: "3to12m", role: "office" })).toEqual([
      "prompt",
      "hallucination",
      "context-window",
      "data-privacy",
      "few-shot",
      "chain-of-thought",
      "projects",
    ]);
  });

  it("unlocks the advanced tier past a year", () => {
    expect(deckIds({ tenure: "over1y", role: "office" })).toHaveLength(CONCEPTS.length);
  });

  it("gives a developer BOTH upper tiers, whatever their tenure — no missing rung", () => {
    // This used to assert the opposite, and in doing so enshrined a defect: the
    // developer override opened `lanjut` only, so "belum pernah pakai AI" plus
    // "developer" produced a deck that ran Dasar -> RAG/MCP/fine-tuning with
    // few-shot, chain-of-thought and Projects missing from the middle. It reads
    // as a broken quiz rather than a deliberate branch.
    const deck = deckIds({ tenure: "never", role: "developer" });
    expect(deck).toHaveLength(CONCEPTS.length);
    expect(deck).toContain("few-shot");
    expect(deck).toContain("mcp");
  });

  it("makes a beginner's run strictly shorter than a veteran's", () => {
    const beginner: PetaDraft = { tenure: "never", role: "student", goal: "curious", budget: "zero" };
    const middling: PetaDraft = { tenure: "3to12m", role: "office", goal: "save-time", budget: "zero" };
    const veteran: PetaDraft = { tenure: "over1y", role: "developer", goal: "build-app", budget: "over300k" };

    expect(stepCount(beginner)).toBeLessThan(stepCount(middling));
    expect(stepCount(middling)).toBeLessThan(stepCount(veteran));
    // Concretely: 6 questions + 4 cards vs 6 questions + 13 cards + 2 branches.
    expect(stepCount(beginner)).toBe(10);
    expect(stepCount(veteran)).toBe(21);
  });
});

describe("stage 4 branches", () => {
  it("asks a developer about coding, and nobody else", () => {
    expect(situationFieldsFor({ role: "developer", budget: "zero" })).toEqual(["codingWithAi"]);
    expect(situationFieldsFor({ role: "office", budget: "zero" })).toEqual([]);
  });

  it("asks about spreadsheets on the data goal or the analyst role", () => {
    expect(situationFieldsFor({ goal: "work-with-data", budget: "zero" })).toContain("spreadsheetComfort");
    expect(situationFieldsFor({ role: "analyst", budget: "zero" })).toContain("spreadsheetComfort");
  });

  it("skips the spend question for Rp0 — they have already answered it", () => {
    expect(situationFieldsFor({ role: "office", budget: "zero" })).not.toContain("spendPriority");
    expect(situationFieldsFor({ role: "office", budget: "under100k" })).toContain("spendPriority");
    // Unanswered budget must not conjure the question either.
    expect(situationFieldsFor({ role: "office" })).not.toContain("spendPriority");
  });
});

describe("the feed drives itself", () => {
  it("asks tenure first, because everything after it depends on the answer", () => {
    expect(nextQuestion({})?.id).toBe("tenure");
  });

  it("terminates, and only then reports complete", () => {
    let draft: PetaDraft = {};
    const answers: PetaAnswers = {
      tenure: "3to12m",
      role: "marketing",
      goal: "make-content",
      budget: "100to300k",
      subscriptions: ["chatgpt-plus"],
      weeklyTime: "1to3h",
      known: ["prompt"],
      situation: { hasChannel: "active", spendPriority: "cheapest" },
    };

    for (let guard = 0; guard < 50; guard++) {
      const q = nextQuestion(draft);
      if (q === null) break;
      expect(isComplete(draft)).toBe(false);
      expect(progress(draft)).toBeLessThan(1);
      if (q.kind === "geser") draft = { ...draft, known: answers.known };
      else if (q.kind === "pilih-banyak") draft = { ...draft, subscriptions: answers.subscriptions };
      else if (q.id === "tenure" || q.id === "role" || q.id === "goal" || q.id === "budget" || q.id === "weeklyTime") {
        draft = { ...draft, [q.id]: answers[q.id] };
      } else {
        draft = { ...draft, situation: { ...draft.situation, [q.id]: answers.situation?.[q.id] } };
      }
    }

    expect(nextQuestion(draft)).toBeNull();
    expect(isComplete(draft)).toBe(true);
    expect(progress(draft)).toBe(1);
  });

  it("re-derives the feed after a back-navigation instead of keeping state", () => {
    const asVeteran: PetaDraft = { tenure: "over1y", role: "office", goal: "save-time", budget: "zero" };
    const asBeginner: PetaDraft = { ...asVeteran, tenure: "never" };
    expect(questionsFor(asBeginner).length).toBeLessThanOrEqual(questionsFor(asVeteran).length);
    expect(conceptsFor(asBeginner)).toHaveLength(4);
  });

  it("never emits a swipe deck with a duplicate card", () => {
    for (const tenure of ["never", "under3m", "3to12m", "over1y"] as const) {
      for (const role of ["office", "developer"] as const) {
        const ids = deckIds({ tenure, role });
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });
});
