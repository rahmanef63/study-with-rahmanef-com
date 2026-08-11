// Barrel API contract (DoD §5.3) — TYPE-LEVEL against ../index, RUNTIME
// against the alias-free pure modules.
//
// Type-level for the barrel because it re-exports .tsx components that pull
// `convex/react`, `lucide-react` and the shadcn kit; importing them for value
// under edge-runtime would test the bundler, not the contract. `import type`
// is erased at runtime and the assertions below are enforced by
// `npx tsc --noEmit` (DoD §5.1) — the same arrangement slices/quiz uses.
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { EMPTY_CATALOGUE } from "../types";
import { EMPTY_RUN } from "../lib/run";
import { PETA_CODE_PARAM } from "../lib/code";
import { PETA_STORAGE_KEY } from "../lib/storage";
import { MAX_PROFILE_ANSWERS } from "../lib/profile";
import { PETA_HREF } from "../components/peta-callout";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the views, entry points, deck, result blocks, hooks and lib", () => {
    // views — what the integrator mounts
    expectTypeOf<typeof Barrel.PetaView>().toBeFunction();
    expectTypeOf<typeof Barrel.PetaResultView>().toBeFunction();
    // entry points
    expectTypeOf<typeof Barrel.PetaCallout>().toBeFunction();
    expectTypeOf<typeof Barrel.PetaEntryCard>().toBeFunction();
    // deck
    expectTypeOf<typeof Barrel.PetaProgress>().toBeFunction();
    expectTypeOf<typeof Barrel.ChoiceQuestion>().toBeFunction();
    expectTypeOf<typeof Barrel.MultiChoiceQuestion>().toBeFunction();
    expectTypeOf<typeof Barrel.SwipeQuestion>().toBeFunction();
    expectTypeOf<typeof Barrel.SwipeCard>().toBeFunction();
    // result
    expectTypeOf<typeof Barrel.LevelBlock>().toBeFunction();
    expectTypeOf<typeof Barrel.PathCard>().toBeFunction();
    expectTypeOf<typeof Barrel.BudgetBlock>().toBeFunction();
    expectTypeOf<typeof Barrel.GapsBlock>().toBeFunction();
    expectTypeOf<typeof Barrel.PrimaryCta>().toBeFunction();
    expectTypeOf<typeof Barrel.ResultActions>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.usePetaRun>().toBeFunction();
    expectTypeOf<typeof Barrel.useSavePeta>().toBeFunction();
    expectTypeOf<typeof Barrel.useSavedPeta>().toBeFunction();
    expectTypeOf<typeof Barrel.useReducedMotion>().toBeFunction();
    // pure lib
    expectTypeOf<typeof Barrel.resolveAgainstCatalogue>().toBeFunction();
    expectTypeOf<typeof Barrel.encodeRun>().toBeFunction();
    expectTypeOf<typeof Barrel.decodeRun>().toBeFunction();
    expectTypeOf<typeof Barrel.toProfilePayload>().toBeFunction();
    expectTypeOf<typeof Barrel.sanitizeDraft>().toBeFunction();
    expectTypeOf<typeof Barrel.loadRun>().toBeFunction();
    expectTypeOf<typeof Barrel.petaFeature>().toHaveProperty("slug");
    expect(true).toBe(true); // runtime anchor so the test registers
  });

  test("the /mulai seam is PLAIN DATA — a function prop cannot cross server→client", () => {
    // `catalogue` is the only required prop and it is serialisable end to end.
    expectTypeOf<Barrel.PetaViewProps>().toHaveProperty("catalogue");
    expectTypeOf<Barrel.PetaViewProps>().toHaveProperty("sharedCode");
    expectTypeOf<Barrel.PetaViewProps["catalogue"]>().toEqualTypeOf<Barrel.LiveCatalogue>();
    expectTypeOf<Barrel.PetaViewProps["sharedCode"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Barrel.LiveCatalogue>().toEqualTypeOf<{
      communities: Barrel.LiveCommunity[];
    }>();
    expectTypeOf<Barrel.LiveCourse>().toEqualTypeOf<{ slug: string; title: string }>();
  });

  test("the saveProfile payload matches the three literals the server accepts", () => {
    expectTypeOf<Barrel.ProfilePayload["level"]>().toEqualTypeOf<
      "pemula" | "menengah" | "mahir"
    >();
    expectTypeOf<Barrel.ProfileAnswer>().toEqualTypeOf<{
      questionId: string;
      optionId: string;
    }>();
    expectTypeOf<Barrel.ProfilePayload["pathSlugs"]>().toEqualTypeOf<string[]>();
  });

  test("the run reducer is pure state in, pure state out", () => {
    expectTypeOf<Barrel.RunState>().toHaveProperty("draft");
    expectTypeOf<Barrel.RunState>().toHaveProperty("swipe");
    expectTypeOf<Barrel.RunProgress>().toEqualTypeOf<{
      answered: number;
      total: number;
      pct: number;
      canGoBack: boolean;
      provisional: boolean;
    }>();
  });
});

describe("barrel runtime contract (alias-free constants)", () => {
  test("the published constants are stable — links and stored runs depend on them", () => {
    expect(PETA_CODE_PARAM).toBe("p");
    expect(PETA_STORAGE_KEY).toBe("peta.run.v1");
    expect(PETA_HREF).toBe("/mulai");
    expect(MAX_PROFILE_ANSWERS).toBe(24);
  });

  test("the empty values are genuinely empty, so a Convex outage renders a plan", () => {
    expect(EMPTY_CATALOGUE).toEqual({ communities: [] });
    expect(EMPTY_RUN).toEqual({ draft: {}, swipe: {} });
  });
});
