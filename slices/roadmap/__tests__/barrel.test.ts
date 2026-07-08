// Barrel API contract test — TYPE-LEVEL against the barrel (the shared
// vitest.config.mts has no `@/*` alias, so a runtime import of ../index — whose
// view pulls @/features/* + @/components/* — cannot resolve under vitest; the
// assertions are enforced by `npx tsc --noEmit`). Metadata pair version sync is
// asserted at runtime via the alias-free JSON imports (pattern: slices/courses,
// slices/progress).
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("roadmap barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the component, connected view, feature, and types", () => {
    expectTypeOf<typeof Barrel.RoadmapNode>().toBeFunction();
    expectTypeOf<typeof Barrel.CourseRoadmap>().toBeFunction();
    expectTypeOf<typeof Barrel.CourseNav>().toBeFunction();
    expectTypeOf<typeof Barrel.roadmapFeature>().toMatchTypeOf<{ slug: string }>();
    expectTypeOf<Barrel.RoadmapLesson>().toBeObject();
    expectTypeOf<Barrel.RoadmapModule>().toBeObject();
    expectTypeOf<Barrel.RoadmapNodeStatus>().toEqualTypeOf<"done" | "next" | "available" | "locked">();
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("roadmap");
    expect(manifest.name).toBe("roadmap");
  });
});
