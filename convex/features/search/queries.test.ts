/// <reference types="vite/client" />
// searchInTenant specs (#23) — DoD §5.2: authz-denied paths (P0), plus the
// draft-guard invariant (drafts NEVER reach members) and projection safety.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourseWithLesson,
  seedTenantFixture,
  setup,
} from "./test.helpers";

const fn = api.features.search.queries.searchInTenant;

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const published = await seedCourseWithLesson(t, fx, {
    status: "published",
    slug: "dasar-fotosintesis",
    title: "Dasar Fotosintesis",
    lessonTitle: "Klorofil dan cahaya",
    // NOTE: the keyword stays a PLAIN whitespace-delimited word — convex-test's
    // search emulation splits on whitespace only, so "**word**" would not match
    // (real Convex tokenizes markdown-adjacent words fine). Markdown lives around
    // the keyword to still exercise snippet stripping.
    contentMd: "# Judul\n\nFotosintesis mengubah **energi** dari [cahaya](https://example.com).",
  });
  const draft = await seedCourseWithLesson(t, fx, {
    status: "draft",
    slug: "draf-fotosintesis",
    title: "Rahasia Fotosintesis Lanjutan",
    lessonTitle: "Materi rahasia",
    contentMd: "Fotosintesis tingkat lanjut yang masih draf.",
  });
  return { t, fx, published, draft };
}

// ── authz-denied paths (P0) ────────────────────────────────────────────────

test("anonymous → NOT_AUTHENTICATED (auth before any read)", async () => {
  const { t, fx } = await fixture();
  await expect(
    t.query(fn, { tenantId: fx.tenantId, q: "fotosintesis" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("outsider (no membership) → NOT_AUTHORIZED", async () => {
  const { t, fx } = await fixture();
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(fn, { tenantId: fx.tenantId, q: "fotosintesis" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("member of ANOTHER tenant → NOT_AUTHORIZED (tenant-scoped membership)", async () => {
  const { t, fx } = await fixture();
  const other = await seedTenantFixture(t, "komunitas-lain");
  await expect(
    t.withIdentity(asUser(other.memberId)).query(fn, { tenantId: fx.tenantId, q: "fotosintesis" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

// ── validation ─────────────────────────────────────────────────────────────

test("q under 2 chars (after trim) → VALIDATION_FAILED", async () => {
  const { t, fx } = await fixture();
  const asMember = t.withIdentity(asUser(fx.memberId));
  await expect(asMember.query(fn, { tenantId: fx.tenantId, q: " a " })).rejects.toThrow(
    /VALIDATION_FAILED/
  );
});

test("q over 60 chars → VALIDATION_FAILED", async () => {
  const { t, fx } = await fixture();
  const asMember = t.withIdentity(asUser(fx.memberId));
  await expect(
    asMember.query(fn, { tenantId: fx.tenantId, q: "x".repeat(61) })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

// ── results + draft-guard (P0) ─────────────────────────────────────────────

test("member finds published course + lesson; drafts NEVER appear", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });

  const courseHits = hits.filter(
    (h): h is Extract<(typeof hits)[number], { kind: "course" }> => h.kind === "course"
  );
  const lessonHits = hits.filter(
    (h): h is Extract<(typeof hits)[number], { kind: "lesson" }> => h.kind === "lesson"
  );

  // Published course matched by title.
  expect(courseHits).toHaveLength(1);
  expect(courseHits[0].courseSlug).toBe("dasar-fotosintesis");
  // Draft course title never appears (index filters status=published).
  expect(hits.some((h: { title: string }) => /Rahasia/.test(h.title))).toBe(false);

  // Lesson under the PUBLISHED course only; draft-course lesson dropped.
  expect(lessonHits).toHaveLength(1);
  expect(lessonHits[0].courseSlug).toBe("dasar-fotosintesis");
  expect(lessonHits[0].title).toBe("Klorofil dan cahaya");
});

test("lesson under archived course is dropped too (draft-guard is 'published only')", async () => {
  const { t, fx } = await fixture();
  await seedCourseWithLesson(t, fx, {
    status: "archived",
    slug: "arsip-fotosintesis",
    title: "Arsip",
    contentMd: "Fotosintesis versi arsip.",
  });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(
    hits.some((h) => "courseSlug" in h && h.courseSlug === "arsip-fotosintesis")
  ).toBe(false);
});

test("results are tenant-scoped: matching rows in another tenant never leak", async () => {
  const { t, fx } = await fixture();
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedCourseWithLesson(t, other, {
    status: "published",
    slug: "fotosintesis-tetangga",
    title: "Fotosintesis Tetangga",
    contentMd: "Fotosintesis milik tenant lain.",
  });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(
    hits.some((h) => "courseSlug" in h && h.courseSlug === "fotosintesis-tetangga")
  ).toBe(false);
});

// ── projection safety (P0) ─────────────────────────────────────────────────
// Exact-shape + snippet specs live in projection.test.ts (#29 moved them out
// to keep this file under the 200-LOC audit; resource specs: resources.test.ts).

// ── bounded reads ──────────────────────────────────────────────────────────

test("course hits are bounded at 10 even when more match", async () => {
  const { t, fx } = await fixture();
  for (let i = 0; i < 12; i++) {
    await seedCourseWithLesson(t, fx, {
      status: "published",
      slug: `kelas-bunga-${i}`,
      title: `Bunga Matahari ${i}`,
      contentMd: "Materi tanpa kata kunci.",
    });
  }
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "bunga" });
  const courseHits = hits.filter((h: { kind: string }) => h.kind === "course");
  expect(courseHits.length).toBeLessThanOrEqual(10);
  expect(courseHits.length).toBeGreaterThan(0);
});
