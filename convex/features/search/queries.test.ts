/// <reference types="vite/client" />
// searchInTenant specs (#23) — DoD §5.2: authz-denied paths (P0), plus the
// draft-guard invariant (drafts NEVER reach members) and projection safety.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourseWithLesson,
  seedMateri,
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

test("member finds the published course title; a DRAFT course title never appears", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });

  const courseHits = hits.filter(
    (h): h is Extract<(typeof hits)[number], { kind: "course" }> => h.kind === "course"
  );
  expect(courseHits).toHaveLength(1);
  expect(courseHits[0].courseSlug).toBe("dasar-fotosintesis");
  // Draft course title never appears (index filters status=published).
  expect(hits.some((h: { title: string }) => /Rahasia/.test(h.title))).toBe(false);
});

test("materi hit is tenant-level: a published materi in a DRAFT course still surfaces", async () => {
  // DECISIONS #36/#37 — the guard moved off the owning course and onto the
  // materi. A draft course hides its own etalase, not the teaching material.
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  const lessonHits = hits.filter(
    (h): h is Extract<(typeof hits)[number], { kind: "lesson" }> => h.kind === "lesson"
  );

  expect(lessonHits.map((h) => h.lessonSlug).sort()).toEqual([
    "dasar-fotosintesis-materi",
    "draf-fotosintesis-materi",
  ]);
  // The href target is the CANONICAL materi URL, so no course slug is projected.
  expect(lessonHits.every((h) => !("courseSlug" in h))).toBe(true);
});

test("a DRAFT MATERI never reaches a member, but instructor+ sees it", async () => {
  const { t, fx } = await fixture();
  await seedMateri(t, fx, {
    slug: "rahasia-fotosintesis",
    status: "draft",
    title: "Draf materi",
    contentMd: "Fotosintesis yang masih draf materi.",
  });

  const asMember = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(asMember.some((h) => "lessonSlug" in h && h.lessonSlug === "rahasia-fotosintesis")).toBe(
    false
  );

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(
    asInstructor.some((h) => "lessonSlug" in h && h.lessonSlug === "rahasia-fotosintesis")
  ).toBe(true);
});

test("a materi with no slug yet is dropped — there is no canonical URL to link", async () => {
  const { t, fx } = await fixture();
  await seedMateri(t, fx, {
    title: "Belum di-backfill",
    contentMd: "Fotosintesis tanpa slug.",
  });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(hits.some((h: { title: string }) => h.title === "Belum di-backfill")).toBe(false);
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
  expect(JSON.stringify(hits)).not.toContain("fotosintesis-tetangga");
});

// ── projection safety (P0) ─────────────────────────────────────────────────
// Exact-shape + snippet specs live in projection.test.ts (#29 moved them out
// to keep this file under the 200-LOC audit; post-source specs: posts.test.ts).

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
