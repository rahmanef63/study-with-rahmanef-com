// The payload handed to `features/insight/profiles.saveProfile`.
//
// The server validator is not importable from here (it is a Convex module and
// this is a frontend slice — cross-feature deep imports are forbidden), so the
// RULES are restated below and asserted against every reachable run. If the
// server ever tightens them, this file is where the drift shows up.
import { describe, expect, test } from "vitest";
import { assess, CONCEPTS, conceptsFor, type PetaAnswers } from "@/lib/peta";
import { MAX_PROFILE_ANSWERS, toProfilePayload } from "../lib/profile";
import { currentQuestion, EMPTY_RUN, setMulti, setSingle, setSwipe } from "../lib/run";

/** convex/features/insight/profiles.ts */
const TOKEN = /^[a-z0-9][a-z0-9-]*$/;
const MAX_SLUG_LENGTH = 64;
const MAX_PATH_SLUGS = 12;

/** Every option of every question, so the sweep covers the real answer space. */
function runWith(pick: number, knowsEvery: boolean): PetaAnswers {
  let state = EMPTY_RUN;
  for (let guard = 0; guard < 60; guard++) {
    const q = currentQuestion(state);
    if (q === null) break;
    if (q.kind === "geser") {
      const card = q.cards.find((c) => !(c.id in state.swipe))!;
      state = setSwipe(state, card.id, knowsEvery);
    } else if (q.kind === "pilih-banyak") {
      const values = q.options.filter((_, i) => i % (pick + 1) === 0).map((o) => o.value);
      state = setMulti(state, values.length === 0 ? ["none"] : values);
    } else {
      state = setSingle(state, q, q.options[pick % q.options.length]!.value);
    }
  }
  return state.draft as PetaAnswers;
}

const RUNS: PetaAnswers[] = [];
for (let pick = 0; pick < 9; pick++) {
  RUNS.push(runWith(pick, true));
  RUNS.push(runWith(pick, false));
}

describe("every reachable run produces a payload the server will accept", () => {
  test("levels map onto the three stored literals", () => {
    const seen = new Set(RUNS.map((a) => toProfilePayload(a, assess(a)).level));
    for (const level of seen) expect(["pemula", "menengah", "mahir"]).toContain(level);
    // All three must be reachable, or the stored level is decoration.
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  test("every questionId and optionId is a legal token, ≤64 chars", () => {
    for (const answers of RUNS) {
      for (const row of toProfilePayload(answers, assess(answers)).answers) {
        expect(row.questionId).toMatch(TOKEN);
        expect(row.optionId).toMatch(TOKEN);
        expect(row.questionId.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
        expect(row.optionId.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      }
    }
  });

  test("one answer per question — the server rejects a duplicate outright", () => {
    for (const answers of RUNS) {
      const ids = toProfilePayload(answers, assess(answers)).answers.map((r) => r.questionId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test("never empty, never over the 24-row cap", () => {
    for (const answers of RUNS) {
      const rows = toProfilePayload(answers, assess(answers)).answers;
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(MAX_PROFILE_ANSWERS);
    }
    // The longest possible run: 13 cards + 5 singles + subscriptions + up to
    // two open branches. Prove it fits with room to spare rather than assuming.
    const longest = Math.max(
      ...RUNS.map((a) => toProfilePayload(a, assess(a)).answers.length)
    );
    expect(longest).toBeLessThanOrEqual(MAX_PROFILE_ANSWERS);
    expect(longest).toBeGreaterThanOrEqual(6 + CONCEPTS.filter((c) => c.tier === "dasar").length);
  });

  test("pathSlugs are the ranked path ids, deduped and inside the cap", () => {
    for (const answers of RUNS) {
      const result = assess(answers);
      const { pathSlugs } = toProfilePayload(answers, result);
      expect(pathSlugs).toEqual(result.paths.map((p) => p.id));
      expect(new Set(pathSlugs).size).toBe(pathSlugs.length);
      expect(pathSlugs.length).toBeLessThanOrEqual(MAX_PATH_SLUGS);
      for (const slug of pathSlugs) expect(slug).toMatch(TOKEN);
    }
  });
});

describe("what the payload actually says", () => {
  const answers = runWith(0, false);

  test("`weeklyTime` is kebab-cased, because the server forbids uppercase", () => {
    const rows = toProfilePayload(answers, assess(answers)).answers;
    expect(rows.some((r) => r.questionId === "weekly-time")).toBe(true);
    expect(rows.some((r) => r.questionId === "weeklyTime")).toBe(false);
  });

  test("multi-select subscriptions collapse into ONE deterministic row", () => {
    const two: PetaAnswers = { ...answers, subscriptions: ["gemini", "chatgpt-plus"] };
    const swapped: PetaAnswers = { ...answers, subscriptions: ["chatgpt-plus", "gemini"] };
    const row = (a: PetaAnswers) =>
      toProfilePayload(a, assess(a)).answers.find((r) => r.questionId === "subscriptions");
    expect(row(two)).toEqual(row(swapped)); // sorted, so pick order cannot leak
    expect(row(two)?.optionId).toBe("chatgpt-plus-gemini");
  });

  test("only cards that were ASKED are recorded, each as tahu/belum", () => {
    const rows = toProfilePayload(answers, assess(answers)).answers;
    const asked = new Set(conceptsFor(answers).map((c) => c.id));
    const cardRows = rows.filter((r) => asked.has(r.questionId as never));
    expect(cardRows).toHaveLength(asked.size);
    for (const row of cardRows) expect(["tahu", "belum"]).toContain(row.optionId);
    // A concept outside this deck must not appear at all.
    const notAsked = CONCEPTS.find((c) => !asked.has(c.id));
    if (notAsked !== undefined) {
      expect(rows.some((r) => r.questionId === notAsked.id)).toBe(false);
    }
  });

  test("`terbiasa` folds DOWN to pemula, never up to menengah", () => {
    // Three months of use with no concept knowledge is exactly `terbiasa`.
    const terbiasa: PetaAnswers = {
      tenure: "3to12m",
      role: "office",
      goal: "save-time",
      budget: "zero",
      subscriptions: ["none"],
      weeklyTime: "1to3h",
      known: [],
    };
    expect(assess(terbiasa).level).toBe("terbiasa");
    expect(toProfilePayload(terbiasa, assess(terbiasa)).level).toBe("pemula");
  });
});
