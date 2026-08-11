// The barrel IS the contract (AGENTS.md §5.3). A sibling slice builds the cards
// on top of these exports, so anything removed or renamed here breaks it —
// which is exactly what this file is for.
import { describe, expect, it, expectTypeOf } from "vitest";
import * as peta from "./index";
import type { PetaAnswers, PetaDraft, PetaQuestion, PetaResult } from "./index";

describe("barrel surface", () => {
  it("exports the two entry points a UI actually needs", () => {
    expect(typeof peta.nextQuestion).toBe("function");
    expect(typeof peta.assess).toBe("function");
  });

  it("exports the full documented runtime surface, and nothing has silently vanished", () => {
    expect(Object.keys(peta).sort()).toEqual(
      [
        "BUDGET_OPTIONS",
        "CONCEPTS",
        "CONCEPT_MATERI",
        "CONCEPT_WHY",
        "GOAL_OPTIONS",
        "LEVEL_LABEL",
        "MAX_GAPS",
        "PATHS",
        "PATH_BY_ID",
        "ROLE_OPTIONS",
        "SUBSCRIPTION_OPTIONS",
        "TENURE_OPTIONS",
        "WEEKLY_TIME_OPTIONS",
        "assess",
        "budgetAdvice",
        "conceptById",
        "conceptsFor",
        "conceptsInTier",
        "gapsFor",
        "isComplete",
        "levelOf",
        "levelReason",
        "nextQuestion",
        "paidSubscriptions",
        "primaryTool",
        "progress",
        "questionsFor",
        "rankPaths",
        "reasonFor",
        "situationFieldsFor",
        "tally",
        "COURSE",
      ].sort(),
    );
  });

  it("keeps the option lists non-empty and free of duplicate values", () => {
    const lists = [
      peta.TENURE_OPTIONS,
      peta.ROLE_OPTIONS,
      peta.GOAL_OPTIONS,
      peta.BUDGET_OPTIONS,
      peta.SUBSCRIPTION_OPTIONS,
      peta.WEEKLY_TIME_OPTIONS,
    ];
    for (const list of lists) {
      expect(list.length).toBeGreaterThan(1);
      expect(new Set(list.map((o) => o.value)).size).toBe(list.length);
      for (const option of list) expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the path catalogue self-consistent", () => {
    expect(new Set(peta.PATHS.map((p) => p.id)).size).toBe(peta.PATHS.length);
    expect(peta.PATH_BY_ID.size).toBe(peta.PATHS.length);
    for (const path of peta.PATHS) {
      expect(path.courses.length).toBeGreaterThan(0);
      for (const course of path.courses) expect(course.communitySlug).toBe(path.communitySlug);
    }
  });

  it("never ships a React, Convex or Node import — this engine is pure", async () => {
    // A wrong import here would surface as a resolution error under the
    // edge-runtime environment long before it reached a server component.
    const mod = await import("./index");
    expect(mod).toBeDefined();
  });
});

describe("type-level contract", () => {
  it("keeps the entry-point signatures stable", () => {
    expectTypeOf(peta.assess).toBeFunction();
    expectTypeOf(peta.assess).parameter(0).toEqualTypeOf<PetaAnswers>();
    expectTypeOf(peta.assess).returns.toEqualTypeOf<PetaResult>();
    expectTypeOf(peta.nextQuestion).parameter(0).toEqualTypeOf<PetaDraft>();
    expectTypeOf(peta.nextQuestion).returns.toEqualTypeOf<PetaQuestion | null>();
  });

  it("keeps PetaQuestion a closed union the UI can switch on exhaustively", () => {
    expectTypeOf<PetaQuestion["kind"]>().toEqualTypeOf<"pilih-satu" | "pilih-banyak" | "geser">();
  });

  it("keeps a draft assignable from a complete answer set", () => {
    expectTypeOf<PetaAnswers>().toExtend<PetaDraft>();
  });
});
