// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel,
// RUNTIME against the alias-free modules (precedent: slices/comments +
// slices/quiz barrel tests; the shared vitest config cannot resolve
// `@/components/ui/*` imports pulled in transitively by the barrel's
// components, so value-importing "../index" breaks under vitest while
// `import type` is erased and enforced by `npx tsc --noEmit` instead).
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { searchFeature } from "../config";
import { SEARCH_COPY, mergeSearchCopy } from "../config/copy";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from "../config/limits";
import { buildCourseHref, buildLessonHref, hitHref } from "../lib/hrefs";
import {
  MAX_QUERY_LENGTH as SERVER_MAX,
  MIN_QUERY_LENGTH as SERVER_MIN,
} from "@convex/features/search/validate";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the required view, components, hooks, lib and types", () => {
    // view (integrator mounts — required by the prompt)
    expectTypeOf<typeof Barrel.SearchView>().toBeFunction();
    // mounting shape alpha relies on
    expectTypeOf<Barrel.SearchViewProps>().toHaveProperty("tenantId");
    expectTypeOf<Barrel.SearchViewProps>().toHaveProperty("tenantSlug");
    expectTypeOf<Barrel.SearchViewProps["onNavigate"]>().toEqualTypeOf<
      ((href: string) => void) | undefined
    >();
    // components
    expectTypeOf<typeof Barrel.SearchInput>().toBeFunction();
    expectTypeOf<typeof Barrel.SearchResults>().toBeFunction();
    expectTypeOf<typeof Barrel.SearchResultItem>().toBeFunction();
    expectTypeOf<typeof Barrel.SearchEmptyState>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.useTenantSearch>().toBeFunction();
    expectTypeOf<typeof Barrel.useDebouncedValue>().toBeFunction();
    // P0 type shape: hits are the safe projection — kind discriminator,
    // lesson carries lessonId + snippet, course carries neither.
    expectTypeOf<Barrel.SearchHit["kind"]>().toEqualTypeOf<
      "course" | "lesson" | "resource"
    >();
    expectTypeOf<Barrel.LessonHit>().toHaveProperty("snippet");
    expectTypeOf<Barrel.LessonHit["snippet"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.CourseHit>().not.toHaveProperty("snippet");
    // Resource hit (#29, v0.2.0): EXACTLY {kind, title, url} — no note,
    // no submittedBy, no id (server projection asserted in convex specs).
    expectTypeOf<Barrel.ResourceHit["url"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.ResourceHit>().not.toHaveProperty("note");
    expectTypeOf<Barrel.ResourceHit>().not.toHaveProperty("submittedBy");
    expectTypeOf<keyof Barrel.ResourceHit>().toEqualTypeOf<"kind" | "title" | "url">();
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(searchFeature.slug).toBe("search");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.version).toBe("0.2.0"); // #29 resource group bump
    expect(sliceJson.slug).toBe("search");
    expect(manifest.name).toBe("search");
  });

  test("limits mirror the server bounds (SSOT: convex validate.ts)", () => {
    expect(MIN_QUERY_LENGTH).toBe(SERVER_MIN);
    expect(MAX_QUERY_LENGTH).toBe(SERVER_MAX);
    expect(SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
  });

  test("copy defaults are Bahasa Indonesia; mergeSearchCopy overrides", () => {
    expect(SEARCH_COPY.sectionTitle).toBe("Pencarian");
    expect(SEARCH_COPY.hintMin).toContain("2 karakter");
    const merged = mergeSearchCopy({ placeholder: "Cari sekarang…" });
    expect(merged.placeholder).toBe("Cari sekarang…");
    expect(merged.sectionTitle).toBe(SEARCH_COPY.sectionTitle);
  });

  test("href builders produce OS-shell deep-links", () => {
    expect(buildCourseHref("belajar-ai", "dasar-ai")).toBe("/kelas/belajar-ai/dasar-ai");
    expect(buildLessonHref("belajar-ai", "dasar-ai", "abc123")).toBe(
      "/kelas/belajar-ai/dasar-ai/lesson/abc123"
    );
    expect(
      hitHref("belajar-ai", { kind: "course", title: "X", courseSlug: "dasar-ai" })
    ).toBe("/kelas/belajar-ai/dasar-ai");
    // Resource href IS the external url — untouched, never rewritten (#29).
    expect(
      hitHref("belajar-ai", { kind: "resource", title: "X", url: "https://contoh.id/x" })
    ).toBe("https://contoh.id/x");
  });
});
