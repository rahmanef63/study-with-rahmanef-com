// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel,
// RUNTIME against the alias-free modules.
//
// Why type-level for the barrel: the shared vitest.config.mts has no `@/*`
// alias yet, so a runtime import of ../index (which pulls component files
// importing @/components/ui/*) cannot resolve under vitest. `import type` is
// erased at runtime; the assertions below are enforced by `npx tsc --noEmit`
// (DoD §5.1) instead.
// TODO(rr): waiting on integrator — add tsconfig-path aliases to
// vitest.config.mts (proposal in gamma's report), then switch this file to a
// value import of "../index" and assert with typeof checks.
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { QUIZ_COPY, mergeQuizCopy } from "../config/copy";
import { quizErrorMessage } from "../lib/errors";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the required views, components, hooks, lib and types", () => {
    // views (integrator mounts — required by the prompt)
    expectTypeOf<typeof Barrel.QuizBuilderView>().toBeFunction();
    expectTypeOf<typeof Barrel.QuizTakeView>().toBeFunction();
    // components
    expectTypeOf<typeof Barrel.QuizResultCard>().toBeFunction();
    expectTypeOf<typeof Barrel.QuizQuestionCard>().toBeFunction();
    expectTypeOf<typeof Barrel.QuizBuilderForm>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.useQuizForTaking>().toBeFunction();
    expectTypeOf<typeof Barrel.useQuizForManage>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyAttempts>().toBeFunction();
    expectTypeOf<typeof Barrel.useQuizBuilderMutations>().toBeFunction();
    expectTypeOf<typeof Barrel.useSubmitAttempt>().toBeFunction();
    // lib
    expectTypeOf<typeof Barrel.quizErrorMessage>().toBeFunction();
    // P0 type shape: the taking projection must NOT carry answer fields
    expectTypeOf<Barrel.QuizPublicQuestion>().toEqualTypeOf<{ prompt: string; options: string[] }>();
    // attempt result reveals correctness post-submit
    expectTypeOf<Barrel.AttemptResult>().toHaveProperty("passed");
    expectTypeOf<Barrel.AttemptResultQuestion>().toHaveProperty("correctIndex");
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("copy defaults are Bahasa Indonesia and mergeQuizCopy overrides", () => {
    expect(QUIZ_COPY.submit).toBe("Kirim jawaban");
    expect(mergeQuizCopy({ submit: "Kirim!" }).submit).toBe("Kirim!");
    expect(mergeQuizCopy().cancel).toBe("Batal");
  });

  test("quizErrorMessage maps typed codes to user copy; VALIDATION_FAILED reuses server msg", () => {
    const copy = mergeQuizCopy();
    expect(
      quizErrorMessage(new ConvexError({ code: "NOT_AUTHENTICATED", message: "x" }), copy)
    ).toBe(copy.errNotAuthenticated);
    expect(
      quizErrorMessage(new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }), copy)
    ).toBe(copy.errNotAuthorized);
    expect(
      quizErrorMessage(new ConvexError({ code: "VALIDATION_FAILED", message: "Pesan server" }), copy)
    ).toBe("Pesan server");
    expect(quizErrorMessage(new Error("random"), copy)).toBe(copy.errUnknown);
  });
});
