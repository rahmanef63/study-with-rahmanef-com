/// <reference types="vite/client" />
// Projection-safety specs (P0: explicit shapes, no raw docs) — moved out of
// queries.test.ts in #29 for the 200-LOC audit; retargeted in #33 to the post
// kind: {kind, title, postId, postKind} EXACTLY — no bodyMd/authorId/linkUrl.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourseWithLesson,
  seedPost,
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
  await seedPost(t, fx, {
    title: "PDF Fotosintesis Ringkas",
    kind: "sumber",
    linkUrl: "https://contoh.id/fotosintesis.pdf",
    bodyMd: "Catatan internal yang TIDAK boleh bocor",
  });
  return { t, fx };
}

test("hit shapes are EXACT per kind — post is {kind,title,postId,postKind} PERSIS", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });

  // All three kinds present in this fixture.
  expect(new Set(hits.map((h: { kind: string }) => h.kind))).toEqual(
    new Set(["course", "lesson", "post"])
  );

  for (const hit of hits) {
    if (hit.kind === "course") {
      expect(Object.keys(hit).sort()).toEqual(["courseSlug", "kind", "title"]);
    } else if (hit.kind === "post") {
      // EXACT shape (#33): no bodyMd, no authorId, no linkUrl, no counters.
      expect(Object.keys(hit).sort()).toEqual(["kind", "postId", "postKind", "title"]);
      expect(hit.postKind).toBe("sumber");
      expect(JSON.stringify(hit)).not.toContain("Catatan internal");
      expect(JSON.stringify(hit)).not.toContain("fotosintesis.pdf");
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
