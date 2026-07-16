/// <reference types="vite/client" />
// Projection-safety specs (P0: explicit shapes, no raw docs) — moved out of
// queries.test.ts in #29 for the 200-LOC audit, and EXTENDED with the resource
// kind: {kind, title, url} EXACTLY — no note/submittedBy/_id ever leaks.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourseWithLesson,
  seedResource,
  seedTenantFixture,
  setup,
} from "./test.helpers";

const fn = api.features.search.queries.searchInTenant;

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourseWithLesson(t, fx, {
    status: "published",
    slug: "dasar-fotosintesis",
    title: "Dasar Fotosintesis",
    lessonTitle: "Klorofil dan cahaya",
    contentMd: "# Judul\n\nFotosintesis mengubah **energi** dari [cahaya](https://example.com).",
  });
  await seedResource(t, fx, {
    status: "approved",
    title: "PDF Fotosintesis Ringkas",
    url: "https://contoh.id/fotosintesis.pdf",
    note: "Catatan internal yang TIDAK boleh bocor",
  });
  return { t, fx };
}

test("hit shapes are EXACT per kind — resource is {kind,title,url} PERSIS", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });

  // All three kinds present in this fixture.
  expect(new Set(hits.map((h: { kind: string }) => h.kind))).toEqual(
    new Set(["course", "lesson", "resource"])
  );

  for (const hit of hits) {
    if (hit.kind === "course") {
      expect(Object.keys(hit).sort()).toEqual(["courseSlug", "kind", "title"]);
    } else if (hit.kind === "resource") {
      // EXACT shape (#29): no note, no submittedBy, no id, no status.
      expect(Object.keys(hit).sort()).toEqual(["kind", "title", "url"]);
      expect(hit.url).toBe("https://contoh.id/fotosintesis.pdf");
    } else {
      expect(Object.keys(hit).sort()).toEqual([
        "courseSlug",
        "kind",
        "lessonId",
        "snippet",
        "title",
      ]);
    }
  }
});

test("snippet is plain text ≤121 chars — markdown markers stripped", async () => {
  const { t, fx } = await fixture();
  await seedCourseWithLesson(t, fx, {
    status: "published",
    slug: "kelas-panjang",
    title: "Kelas Panjang",
    contentMd: `# Heading\n\nFotosintesis **panjang** [tautan](https://x.id) ${"kata ".repeat(60)}`,
  });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  const long = hits.find(
    (h): h is Extract<(typeof hits)[number], { kind: "lesson" }> =>
      h.kind === "lesson" && h.courseSlug === "kelas-panjang"
  );
  expect(long).toBeDefined();
  expect(long!.snippet.length).toBeLessThanOrEqual(121); // 120 + ellipsis
  expect(long!.snippet).not.toMatch(/[#*_`]|\]\(|https:\/\//);
});
