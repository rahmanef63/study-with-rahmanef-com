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
import {
  LIBRARY_PAGE_MAX,
  LIBRARY_PAGE_SIZE,
  MAX_PROMPT_CHARS,
  MAX_TAGS_PER_LESSON,
  PROMPT_PREVIEW_CHARS,
  SKILL_QUERY_MAX,
  SKILL_QUERY_MIN,
  SKILL_SEARCH_MAX_RESULTS,
} from "../config/limits";
import { extractMateriError, isMateriMissing, materiErrorMessage } from "../lib/errors";
import {
  buildCourseHref,
  buildKindLibraryHref,
  buildKindPageHref,
  buildMateriHref,
  buildMateriPageHref,
  buildMateriTagHref,
  buildSkillPageHref,
  buildSkillsHref,
  buildSkillTagHref,
} from "../lib/hrefs";
import { INSET_CAPTION, INSET_GROUP, INSET_ROW } from "../lib/inset";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the three mounted views, the components and the hooks", () => {
    expectTypeOf<typeof Barrel.MateriLibraryView>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriDetailView>().toBeFunction();
    expectTypeOf<typeof Barrel.SkillsLibraryView>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriPageHeader>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriList>().toBeFunction();
    expectTypeOf<typeof Barrel.PromptPanel>().toBeFunction();
    expectTypeOf<typeof Barrel.SkillsEmpty>().toBeFunction();
    expectTypeOf<typeof Barrel.SortControl>().toBeFunction();
    expectTypeOf<typeof Barrel.useSkillSearch>().toBeFunction();
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
    // tenantSlug is a STRING on all three: a function prop cannot cross the
    // server→client boundary, so no href builder is ever passed down. Same
    // reason `kelolaHref` on the skills library is a string, not a builder.
    expectTypeOf<Barrel.MateriLibraryViewProps["tenantSlug"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.MateriDetailViewProps["tenantSlug"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.SkillsLibraryViewProps["tenantSlug"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.SkillsLibraryViewProps["kelolaHref"]>().toEqualTypeOf<string>();
    expectTypeOf<Barrel.SkillsLibraryViewProps>().toHaveProperty("gate");
    // MateriPageHeader is the ONE exception, and only because it is a SERVER
    // component rendered by a server component — its `tagHref` never crosses
    // the boundary.
    expectTypeOf<Barrel.MateriPageHeaderProps["tagHref"]>().toBeFunction();
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

  test("the PROMPT is member-only, structurally", () => {
    // The whole security question of the skills feature. `kind` is a category
    // and rides the etalase so a share card and a redirect can read it; the
    // prompt is the thing membership buys and is not on the anonymous
    // projection AT ALL — so a server component has nothing to leak, even by
    // mistake. The server asserts the same thing key-by-key in queries.test.ts.
    expectTypeOf<Barrel.PublicMateri>().toHaveProperty("kind");
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("promptText");
    expectTypeOf<Barrel.PublicMateri>().not.toHaveProperty("promptPreview");
    // MEMBER+ surfaces are the only ones that carry it.
    expectTypeOf<Barrel.MateriDetail>().toHaveProperty("promptText");
    expectTypeOf<Barrel.MateriCard>().toHaveProperty("promptPreview");
    expectTypeOf<Barrel.MateriCard>().toHaveProperty("kind");
    // An absent column reads as "materi" — the same rule as `status`.
    expectTypeOf<Barrel.MateriKind>().toEqualTypeOf<"materi" | "skill">();
    expectTypeOf<Barrel.MateriSort>().toEqualTypeOf<"newest" | "oldest" | "title">();
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
    expect(buildSkillPageHref("a b", "c/d")).toBe("/k/a%20b/skills/c%2Fd");
    expect(buildSkillTagHref("t", "ai & data")).toBe("/k/t/skills?tag=ai%20%26%20data");
  });

  test("the skills routes match communityHref too", () => {
    expect(buildSkillsHref("belajar-ai")).toBe(communityHref.skills("belajar-ai"));
    expect(buildSkillPageHref("belajar-ai", "ringkas-rapat")).toBe(
      communityHref.skillPage("belajar-ai", "ringkas-rapat")
    );
  });

  test("buildKindPageHref dispatches on the ROW'S kind, not the route's", () => {
    // ONE slug namespace, two routes. This function is why a wrong-kind link
    // is a redirect rather than a 404, and why a list never emits one.
    expect(buildKindPageHref("t", "skill", "x")).toBe("/k/t/skills/x");
    expect(buildKindPageHref("t", "materi", "x")).toBe("/k/t/materi/x");
    expect(buildKindLibraryHref("t", "skill")).toBe("/k/t/skills");
    expect(buildKindLibraryHref("t", "materi")).toBe("/k/t/materi");
    // The two permalinks are DIFFERENT URLs — if they ever collapse, the
    // redirect loops.
    expect(buildKindPageHref("t", "skill", "x")).not.toBe(buildKindPageHref("t", "materi", "x"));
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(materiFeature.slug).toBe("materi");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("materi");
    expect(manifest.name).toBe("materi");
  });

  test("Materi and Skills are real nav rows, adjacent, and this slice owns their hrefs", () => {
    // WAS: an ordinal pin — `COMMUNITY_TABS[0] === "materi"`, `[1] === "skills"`,
    // `slice(0,4) === [materi, skills, kelas, diskusi]` — because the phone
    // bottom bar took the first four keys off the list and those four WERE the
    // five-cell bar. The bar, the "Lainnya" sheet and `phoneBarTabs()` were all
    // deleted on 2026-08-11 in favour of a dashboard rail that renders every
    // row, so nothing is decided by an index any more and the catalogue was
    // re-ordered for reading (Kelas first: it is /k/<slug>, the route you land
    // on). Pinning positions here would have made this slice the veto on a list
    // it does not own.
    //
    // What this slice DOES have a stake in, and what is pinned instead: both
    // rows exist, both point at the hrefs built here, and they sit next to each
    // other — a skill IS a materi (`kind: "skill"`, same table), so a row
    // between them would split one content model in the navigation. The reading
    // order itself is pinned where it belongs, in
    // components/community/tab-visibility.test.ts.
    const keys = COMMUNITY_TABS.map((t) => t.key);
    const materi = COMMUNITY_TABS.find((t) => t.key === "materi");
    const skills = COMMUNITY_TABS.find((t) => t.key === "skills");
    expect(materi?.href("belajar-ai")).toBe(buildMateriHref("belajar-ai"));
    expect(skills?.href("belajar-ai")).toBe(buildSkillsHref("belajar-ai"));
    expect(keys.indexOf("skills")).toBe(keys.indexOf("materi") + 1);
  });

  test("the Skills tab does not steal the Materi tab's active state", () => {
    // Both are prefix-matched (`exact` is unset), and "/k/t/skills" must not
    // start with "/k/t/materi" or the strip would light two cells at once.
    expect(buildSkillsHref("t").startsWith(buildMateriHref("t"))).toBe(false);
    expect(buildMateriHref("t").startsWith(buildSkillsHref("t"))).toBe(false);
  });

  test("limits mirror the server bounds", () => {
    expect(LIBRARY_PAGE_MAX).toBe(20); // clampPageSize ceiling
    expect(LIBRARY_PAGE_SIZE).toBeLessThanOrEqual(LIBRARY_PAGE_MAX);
    expect(MAX_TAGS_PER_LESSON).toBe(12);
    // materi/validate.ts: MAX_PROMPT_CHARS, PROMPT_PREVIEW_CHARS,
    // SEARCH_Q_MIN/MAX and MAX_SEARCH_RESULTS = LIBRARY_PAGE_MAX.
    expect(MAX_PROMPT_CHARS).toBe(4_000);
    expect(PROMPT_PREVIEW_CHARS).toBe(160);
    expect(PROMPT_PREVIEW_CHARS).toBeLessThan(MAX_PROMPT_CHARS);
    expect(SKILL_QUERY_MIN).toBe(2);
    expect(SKILL_QUERY_MAX).toBe(60);
    expect(SKILL_SEARCH_MAX_RESULTS).toBe(LIBRARY_PAGE_MAX);
  });

  test("the inset geometry keeps the design-system invariants", () => {
    // WAS "radius 0 everywhere (never rounded-*)". That invariant died with the
    // arcade system on 2026-08-14: --radius is 0.375rem now and a group that
    // stayed square would be the one square box on the page. What still has to
    // hold is that the radius comes from the TOKEN — a literal `rounded-lg`
    // here would pin a value the theme cannot move, and it would also fail the
    // dead-utility guard in components/ui/design-system.test.ts.
    expect(INSET_GROUP).toContain("rounded-[var(--radius)]");
    expect(INSET_GROUP).not.toMatch(/rounded-(?:none|xs|sm|md|lg|xl)\b/);
    expect(INSET_ROW).not.toMatch(/rounded/);
    expect(INSET_GROUP).toContain("shadow-sm");
    expect(INSET_ROW).toContain("min-h-14");
    // The display face is display-ONLY, and only at the caption size.
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

  test("the empty skills library EXPLAINS itself instead of saying 'belum ada'", () => {
    // The library ships empty on purpose (prompts were deferred), so this copy
    // is the launch screen. It has to answer both questions an empty room
    // raises: what a skill is, and who puts one here.
    expect(MATERI_COPY.emptySkillsWhat).toMatch(/prompt/i);
    expect(MATERI_COPY.emptySkillsWhat).toMatch(/materi/i); // what it is NOT
    expect(MATERI_COPY.emptySkillsWhat.length).toBeGreaterThan(80);
    expect(MATERI_COPY.emptySkillsHow).toMatch(/pengajar/i);
    expect(MATERI_COPY.emptySkillsHowInstructor).toMatch(/Kelola/);
    expect(MATERI_COPY.emptySkillsSearch("tabel")).toContain("tabel");
  });

  test("the sort control names all three orders and admits what A→Z does", () => {
    expect([
      MATERI_COPY.sortNewest,
      MATERI_COPY.sortOldest,
      MATERI_COPY.sortTitle,
    ]).toEqual(["Terbaru", "Terlama", "A→Z"]);
    // A→Z only orders the loaded pages (`lessons` has no title index and may
    // not grow one). The note is the honesty, so it must not be empty.
    expect(MATERI_COPY.sortTitleNote.length).toBeGreaterThan(10);
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
