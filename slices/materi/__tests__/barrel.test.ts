// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4) —
// TYPE-LEVEL against the barrel, RUNTIME against the alias-free modules.
//
// Why type-level for the barrel: vitest.config.mts aliases `@` to the repo root
// but has NO `@/features/*` entry, so a runtime import of ../index — whose
// views pull @/features/tenants and whose MateriBody pulls @/features/courses —
// cannot resolve under vitest (same note as slices/posts/__tests__). `import
// type` is erased at runtime; the assertions below are enforced by
// `npx tsc --noEmit` (DoD §5.1) instead.
// TODO(rr): waiting on integrator — mirror the tsconfig `@/features/*` path in
// vitest.config.mts, then switch to a value import of "../index".
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { communityHref, COMMUNITY_TABS } from "@/lib/community";
import { materiFeature } from "../config";
import { MATERI_COPY, mergeMateriCopy } from "../config/copy";
import { LIBRARY_PAGE_MAX, LIBRARY_PAGE_SIZE, MAX_TAGS_PER_LESSON } from "../config/limits";
import { extractMateriError, isMateriMissing, materiErrorMessage } from "../lib/errors";
import {
  buildCourseHref,
  buildMateriHref,
  buildMateriPageHref,
  buildMateriTagHref,
} from "../lib/hrefs";
import { INSET_CAPTION, INSET_GROUP, INSET_ROW } from "../lib/inset";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the two mounted views, the components and the hooks", () => {
    expectTypeOf<typeof Barrel.MateriLibraryView>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriDetailView>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriRow>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriBody>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriBacklinks>().toBeFunction();
    expectTypeOf<typeof Barrel.TagChips>().toBeFunction();
    expectTypeOf<typeof Barrel.TagRow>().toBeFunction();
    expectTypeOf<typeof Barrel.useMateriLibrary>().toBeFunction();
    expectTypeOf<typeof Barrel.useMateriTags>().toBeFunction();
    expectTypeOf<typeof Barrel.useMateri>().toBeFunction();
    expectTypeOf<typeof Barrel.useMateriBacklinks>().toBeFunction();
  });

  test("the mount seams are part of the contract", () => {
    // `gate` is a ReactNode, never a component this slice imports — the join
    // CTA belongs to app/ and a slice may not reach into it.
    expectTypeOf<Barrel.MateriLibraryViewProps>().toHaveProperty("gate");
    expectTypeOf<Barrel.MateriLibraryViewProps>().toHaveProperty("initialTag");
    expectTypeOf<Barrel.MateriDetailViewProps>().toHaveProperty("gate");
    // The server may have rendered the <h1> already (etalase) or not (draft).
    expectTypeOf<Barrel.MateriDetailViewProps>().toHaveProperty("hasServerHeading");
    // tenantSlug is a STRING on both: a function prop cannot cross the
    // server→client boundary, so no href builder is ever passed down.
    expectTypeOf<Barrel.MateriLibraryViewProps["tenantSlug"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.MateriDetailViewProps["tenantSlug"]>().toEqualTypeOf<string>();
    expect(true).toBe(true); // runtime anchor so the test registers
  });

  test("the projections keep the body off the anonymous surface", () => {
    // P0: the etalase type must never grow a body. If someone adds contentMd
    // to PublicMateri, this fails before it reaches a crawler.
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("contentMd");
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("contentBlocks");
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("links");
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("youtubeVideoId");
    expectTypeOf<Barrel.PublicMateri>().toHaveProperty("hasVideo");
    // The member projection is the one that carries content.
    expectTypeOf<Barrel.MateriDetail>().toHaveProperty("contentMd");
    expectTypeOf<Barrel.MateriDetail>().toHaveProperty("backlinks");
    expectTypeOf<Barrel.MateriStatus>().toEqualTypeOf<"draft" | "published">();
  });
});

describe("hrefs match lib/community.ts (the app's route SSOT)", () => {
  test("library + permalink are byte-identical to communityHref", () => {
    expect(buildMateriHref("belajar-ai")).toBe(communityHref.materi("belajar-ai"));
    expect(buildMateriPageHref("belajar-ai", "prompt-dasar")).toBe(
      communityHref.materiPage("belajar-ai", "prompt-dasar")
    );
    expect(buildCourseHref("belajar-ai", "claude-code")).toBe(
      communityHref.course("belajar-ai", "claude-code")
    );
  });

  test("the canonical materi URL is NOT the in-course URL", () => {
    // The whole point of the model: a shared link must survive the materi
    // being moved between courses.
    expect(buildMateriPageHref("t", "materi-1")).toBe("/k/t/materi/materi-1");
    expect(communityHref.lesson("t", "kelas-1", "abc123")).toBe("/k/t/kelas/kelas-1/abc123");
  });

  test("every segment is encoded", () => {
    expect(buildMateriPageHref("a b", "c/d")).toBe("/k/a%20b/materi/c%2Fd");
    expect(buildMateriTagHref("t", "ai & data")).toBe("/k/t/materi?tag=ai%20%26%20data");
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(materiFeature.slug).toBe("materi");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("materi");
    expect(manifest.name).toBe("materi");
  });

  test("Materi is a real tab, first in the strip", () => {
    // The phone bar takes the first four keys off this list, so the order is
    // load-bearing, not decoration.
    expect(COMMUNITY_TABS[0]?.key).toBe("materi");
    expect(COMMUNITY_TABS[0]?.href("belajar-ai")).toBe(buildMateriHref("belajar-ai"));
    expect(COMMUNITY_TABS.slice(0, 4).map((t) => t.key)).toEqual([
      "materi",
      "kelas",
      "diskusi",
      "anggota",
    ]);
  });

  test("limits mirror the server bounds", () => {
    expect(LIBRARY_PAGE_MAX).toBe(20); // clampPageSize ceiling
    expect(LIBRARY_PAGE_SIZE).toBeLessThanOrEqual(LIBRARY_PAGE_MAX);
    expect(MAX_TAGS_PER_LESSON).toBe(12);
  });

  test("the inset geometry keeps the design-system invariants", () => {
    // radius 0 everywhere (never rounded-*), hard offset shadow, 56px rows.
    expect(INSET_GROUP).not.toMatch(/rounded/);
    expect(INSET_ROW).not.toMatch(/rounded/);
    expect(INSET_GROUP).toContain("shadow-[3px_3px_0_0_var(--pixel-shadow)]");
    expect(INSET_ROW).toContain("min-h-14");
    // Press Start 2P is display-ONLY, and only at the caption size.
    expect(INSET_CAPTION).toContain("font-display");
    expect(INSET_ROW).not.toContain("font-display");
    // Tokens only — a hex literal here would break theming (P1).
    for (const cls of [INSET_GROUP, INSET_ROW, INSET_CAPTION]) {
      expect(cls).not.toMatch(/#[0-9a-f]{3}/i);
    }
  });

  test("copy defaults are Bahasa Indonesia; mergeMateriCopy overrides", () => {
    expect(MATERI_COPY.appearsInLabel).toBe("Muncul di kelas");
    expect(MATERI_COPY.emptySearch("regex")).toContain("regex");
    const merged = mergeMateriCopy({ libraryTitle: "Bahan" });
    expect(merged.libraryTitle).toBe("Bahan");
    expect(merged.appearsInLabel).toBe(MATERI_COPY.appearsInLabel);
  });

  test("errors map to copy, never to a raw code", () => {
    const copy = mergeMateriCopy();
    // A draft materi, a deleted one and a typo'd slug all arrive as NOT_FOUND
    // — one code, on purpose (no existence oracle).
    const missing = new ConvexError({ code: "NOT_FOUND", message: "Materi tidak ditemukan" });
    expect(isMateriMissing(missing)).toBe(true);
    expect(materiErrorMessage(missing, copy)).toBe(copy.errNotFound);
    expect(materiErrorMessage(missing, copy)).not.toMatch(/NOT_FOUND/);
    expect(
      materiErrorMessage(new ConvexError({ code: "NOT_AUTHORIZED" }), copy)
    ).toBe(copy.errNotAuthorized);
    expect(materiErrorMessage(new Error("boom"), copy)).toBe(copy.errUnknown);
    expect(extractMateriError(new Error("boom"))).toEqual({});
    expect(isMateriMissing(new Error("boom"))).toBe(false);
  });
});
