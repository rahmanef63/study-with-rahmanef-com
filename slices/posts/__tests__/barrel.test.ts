// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4) —
// TYPE-LEVEL against the barrel, RUNTIME against the alias-free modules.
//
// Why type-level for the barrel: vitest.config.mts aliases `@` to the repo root
// but has NO `@/features/*` entry, so a runtime import of ../index — whose
// FeedView pulls @/features/tenants and whose PostBody pulls @/features/courses
// — cannot resolve under vitest (same note as slices/courses/__tests__ and
// slices/comments/__tests__). `import type` is erased at runtime; the
// assertions below are enforced by `npx tsc --noEmit` (DoD §5.1) instead.
// TODO(rr): waiting on integrator — mirror the tsconfig `@/features/*` path in
// vitest.config.mts, then switch to a value import of "../index".
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { postsFeature } from "../config";
import { POSTS_COPY, mergePostsCopy } from "../config/copy";
import { EXCERPT_CHARS, MAX_BODY, MAX_TITLE, MIN_TITLE } from "../config/limits";
import { extractPostsError, isRateLimited, postsErrorMessage } from "../lib/errors";
import { toExcerpt, toPlainText } from "../lib/excerpt";
import { POST_KINDS, parsePostKind, postKindLabel, postKindTone } from "../lib/kind";
import { formatRelativeTime, toIsoDate } from "../lib/time";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the required view, components, hooks and lib", () => {
    // view (integrator mounts — required by the assignment)
    expectTypeOf<typeof Barrel.FeedView>().toBeFunction();
    // components
    expectTypeOf<typeof Barrel.PostCard>().toBeFunction();
    expectTypeOf<typeof Barrel.PostBody>().toBeFunction();
    expectTypeOf<typeof Barrel.CategoryChips>().toBeFunction();
    expectTypeOf<typeof Barrel.PostComposer>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.usePostFeed>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyPosts>().toBeFunction();
    expectTypeOf<typeof Barrel.useMyLikedPostIds>().toBeFunction();
    expectTypeOf<typeof Barrel.useCreatePost>().toBeFunction();
    expectTypeOf<typeof Barrel.useToggleLike>().toBeFunction();
    // lib
    expectTypeOf<typeof Barrel.toExcerpt>().toBeFunction();
    expectTypeOf<typeof Barrel.postsErrorMessage>().toBeFunction();
  });

  test("the SSR seam and the kind union are part of the contract", () => {
    // The server page hands its first page over as `initialPosts` — that prop
    // IS the indexability contract of #29.
    expectTypeOf<Barrel.FeedViewProps>().toHaveProperty("initialPosts");
    expectTypeOf<Barrel.FeedViewProps>().toHaveProperty("postHref");
    // Four fixed kinds, no categories table.
    expectTypeOf<Barrel.PostKind>().toEqualTypeOf<
      "diskusi" | "pengumuman" | "usulan" | "sumber"
    >();
    expectTypeOf<Barrel.PostKindFilter>().toEqualTypeOf<Barrel.PostKind | null>();
    // Anonymous projection: counts travel, the viewer's like state does not.
    expectTypeOf<Barrel.PublicPost>().toHaveProperty("likeCount");
    expectTypeOf<Barrel.PublicPost>().toHaveProperty("commentCount");
    expectTypeOf<Barrel.PublicPost>().not.toHaveProperty("authorId");
    expectTypeOf<Barrel.PublicPost>().not.toHaveProperty("tenantId");
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(postsFeature.slug).toBe("posts");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("posts");
    expect(manifest.name).toBe("posts");
  });

  test("limits mirror the server bounds", () => {
    expect(MIN_TITLE).toBe(3);
    expect(MAX_TITLE).toBe(140);
    expect(MAX_BODY).toBe(5000);
  });

  test("the kind vocabulary covers exactly the server union", () => {
    expect([...POST_KINDS]).toEqual(["diskusi", "pengumuman", "usulan", "sumber"]);
    const copy = mergePostsCopy();
    for (const kind of POST_KINDS) {
      expect(postKindLabel(kind, copy).length).toBeGreaterThan(0);
      // Token classes only — a hex literal here would break theming (P1).
      expect(postKindTone(kind)).toMatch(/chart-\d/);
      expect(postKindTone(kind)).not.toMatch(/#[0-9a-f]{3}/i);
    }
    expect(parsePostKind("sumber")).toBe("sumber");
    expect(parsePostKind("tidak-ada")).toBeNull();
    expect(parsePostKind(null)).toBeNull();
  });

  test("excerpt collapses markdown to plain text and never leaks syntax", () => {
    expect(toPlainText("# Judul\n\n**tebal** dan [dok](https://x.dev)")).toBe(
      "Judul tebal dan dok"
    );
    expect(toPlainText("```js\nconst a = 1;\n```")).toBe("");
    expect(toExcerpt("halo")).toBe("halo");
    const long = toExcerpt("kata ".repeat(200));
    expect(long.length).toBeLessThanOrEqual(EXCERPT_CHARS + 1);
    expect(long.endsWith("…")).toBe(true);
  });

  test("relative time is Bahasa Indonesia; toIsoDate is machine-readable", () => {
    const now = Date.UTC(2026, 7, 9, 12, 0, 0);
    expect(formatRelativeTime(now, now)).toBe("baru saja");
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe("3 menit lalu");
    expect(formatRelativeTime(now - 5 * 3_600_000, now)).toBe("5 jam lalu");
    expect(toIsoDate(now)).toBe("2026-08-09T12:00:00.000Z");
  });

  test("copy defaults are Bahasa Indonesia; mergePostsCopy overrides", () => {
    expect(POSTS_COPY.feedTitle).toBe("Diskusi");
    const merged = mergePostsCopy({ submit: "Kirim sekarang" });
    expect(merged.submit).toBe("Kirim sekarang");
    expect(merged.feedTitle).toBe(POSTS_COPY.feedTitle);
  });

  test("RATE_LIMITED surfaces friendly copy, never a raw code", () => {
    const copy = mergePostsCopy();
    const capped = new ConvexError({
      code: "RATE_LIMITED",
      message: "Maksimal 10 post per hari — lanjutkan obrolan cepat di Discord ya",
    });
    expect(postsErrorMessage(capped, copy)).toBe(
      "Maksimal 10 post per hari — lanjutkan obrolan cepat di Discord ya"
    );
    expect(postsErrorMessage(capped, copy)).not.toMatch(/RATE_LIMITED/);
    expect(isRateLimited(capped)).toBe(true);
    // A code with no server message still resolves to Bahasa copy.
    expect(
      postsErrorMessage(new ConvexError({ code: "RATE_LIMITED" }), copy)
    ).toBe(copy.errRateLimited);
    expect(
      postsErrorMessage(new ConvexError({ code: "NOT_AUTHENTICATED", message: "x" }), copy)
    ).toBe(copy.errNotAuthenticated);
    expect(postsErrorMessage(new Error("boom"), copy)).toBe(copy.errUnknown);
    expect(extractPostsError(new Error("boom"))).toEqual({});
    expect(isRateLimited(new Error("boom"))).toBe(false);
  });
});
