// The share code. It is a PERMALINK to a plan with no row behind it, so the
// only thing standing between a shared URL and a wrong plan is this file.
import { describe, expect, test } from "vitest";
import { conceptsFor, assess, isComplete, questionsFor } from "@/lib/peta";
import type { PetaDraft } from "@/lib/peta";
import { decodeRun, encodeRun, PETA_CODE_PARAM } from "../lib/code";
import { currentQuestion, EMPTY_RUN, setMulti, setSingle, setSwipe } from "../lib/run";
import type { RunState } from "../lib/run";

function play(picks: Record<string, string>, knows: (id: string) => boolean): RunState {
  let state = EMPTY_RUN;
  for (let guard = 0; guard < 60; guard++) {
    const q = currentQuestion(state);
    if (q === null) return state;
    if (q.kind === "geser") {
      const card = q.cards.find((c) => !(c.id in state.swipe))!;
      state = setSwipe(state, card.id, knows(card.id));
    } else if (q.kind === "pilih-banyak") {
      state = setMulti(state, (picks.subscriptions ?? "none").split(","));
    } else {
      state = setSingle(state, q, picks[q.id] ?? q.options[0]!.value);
    }
  }
  throw new Error("run did not terminate");
}

const VETERAN = play(
  {
    tenure: "over1y",
    role: "developer",
    goal: "build-app",
    budget: "100to300k",
    weeklyTime: "3to7h",
    subscriptions: "claude-pro,gemini",
    codingWithAi: "routinely",
    spendPriority: "best-result",
  },
  (id) => id !== "mcp" && id !== "rag"
);

const NEWCOMER = play(
  {
    tenure: "never",
    role: "teacher",
    goal: "save-time",
    budget: "zero",
    weeklyTime: "under1h",
    subscriptions: "none",
  },
  () => false
);

describe("round trip", () => {
  test("a complete run survives encode → decode byte for byte", () => {
    for (const run of [VETERAN, NEWCOMER]) {
      const decoded = decodeRun(encodeRun(run.draft));
      expect(decoded).toEqual(run.draft);
      expect(isComplete(decoded)).toBe(true);
    }
  });

  test("and therefore produces an IDENTICAL plan — the whole point of sharing", () => {
    for (const run of [VETERAN, NEWCOMER]) {
      const mine = assess(run.draft as never);
      const theirs = assess(decodeRun(encodeRun(run.draft)) as never);
      expect(theirs).toEqual(mine);
    }
  });

  test("a PARTIAL run round-trips too, so a link can hand over an unfinished draft", () => {
    let partial = EMPTY_RUN;
    partial = setSingle(partial, currentQuestion(partial)!, "3to12m");
    partial = setSingle(partial, currentQuestion(partial)!, "analyst");
    expect(decodeRun(encodeRun(partial.draft))).toEqual(partial.draft);
    expect(isComplete(decodeRun(encodeRun(partial.draft)))).toBe(false);
  });

  test("the code is URL-safe: encodeURIComponent leaves it untouched", () => {
    const code = encodeRun(VETERAN.draft);
    expect(encodeURIComponent(code)).toBe(code);
    expect(code).toMatch(/^[A-Za-z0-9~._-]+$/);
  });
});

describe("hostile and stale input", () => {
  test("junk of every shape decodes to an empty draft instead of throwing", () => {
    for (const bad of [
      undefined,
      null,
      "",
      "0",
      "not-a-code",
      "2~over1y~developer", // a future version
      "~~~~~~~~",
      "1~" + "x".repeat(4000),
      "1~<script>~role",
    ]) {
      expect(() => decodeRun(bad)).not.toThrow();
      expect(isComplete(decodeRun(bad))).toBe(false);
    }
  });

  test("a token that is not an option is REJECTED, not coerced to a neighbour", () => {
    const tampered = encodeRun(VETERAN.draft).replace("developer", "wizard");
    const decoded = decodeRun(tampered);
    // Truncated at `role`, so tenure survived and nothing after it did.
    expect(decoded.tenure).toBe("over1y");
    expect(decoded.role).toBeUndefined();
    expect(decoded.goal).toBeUndefined();
  });

  test("an over-long code is rejected outright rather than parsed", () => {
    expect(decodeRun("1~" + "over1y~".repeat(500))).toEqual({});
  });

  test("`known` entries outside the CURRENT deck are dropped, not trusted", () => {
    // "few-shot" is a menengah card; a `never` tenure never sees it.
    const forged = "1~never~teacher~save-time~zero~none~under1h~prompt.few-shot.mcp~-";
    const decoded = decodeRun(forged);
    expect(decoded.known).toEqual(["prompt"]);
    expect(conceptsFor(decoded).map((c) => c.id)).not.toContain("few-shot");
  });

  test("a situation answer for a CLOSED branch never lands in the draft", () => {
    // budget zero closes spendPriority; the pair is present in the code anyway.
    const forged =
      "1~never~teacher~save-time~zero~none~under1h~prompt.hallucination.context-window.data-privacy~spendPriority_cheapest";
    const decoded: PetaDraft = decodeRun(forged);
    expect(decoded.situation?.spendPriority).toBeUndefined();
    expect(isComplete(decoded)).toBe(true);
    expect(questionsFor(decoded).some((q) => q.kind !== "geser" && q.id === "spendPriority")).toBe(
      false
    );
  });
});

test("the query parameter name is stable — old links must keep working", () => {
  expect(PETA_CODE_PARAM).toBe("p");
});
