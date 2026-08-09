/// <reference types="vite/client" />
// Third-source specs — RENAMED + REWRITTEN from resources.test.ts (v1.8 #33).
// The curated resource board is gone; the third search source is the Diskusi
// feed. The invariant that used to be "approved-only" is now "not soft-deleted",
// and the coverage that survives is the same: the third source works, it is
// tenant-scoped, it is bounded, and it never surfaces hidden rows.
// Shape exactness: projection.test.ts.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedPost, seedTenantFixture, setup } from "./test.helpers";

const fn = api.features.search.queries.searchInTenant;

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedPost(t, fx, {
    title: "Panduan Prompt Engineering",
    kind: "sumber",
    linkUrl: "https://contoh.id/panduan-prompt",
  });
  await seedPost(t, fx, {
    title: "Prompt Rahasia Sudah Dihapus",
    kind: "diskusi",
    deleted: true,
  });
  return { t, fx };
}

function postHits(hits: Array<{ kind: string }>) {
  return hits.filter((h) => h.kind === "post") as Array<{
    kind: "post";
    title: string;
    postId: string;
    postKind: string;
  }>;
}

test("member finds a post by title through the posts.search_title index", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "Prompt Engineering" });
  const res = postHits(hits);
  expect(res).toHaveLength(1);
  expect(res[0].title).toBe("Panduan Prompt Engineering");
  expect(res[0].postKind).toBe("sumber");
});

test("SOFT-DELETED posts NEVER appear (P0 — the successor of the approved-only gate)", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  const res = postHits(hits);
  expect(res.some((h) => /Dihapus/.test(h.title))).toBe(false);
  expect(res).toHaveLength(1); // only the live one
});

test("every live kind is searchable — pengumuman and usulan are not special-cased", async () => {
  const { t, fx } = await fixture();
  await seedPost(t, fx, { title: "Pengumuman Prompt Day", kind: "pengumuman" });
  await seedPost(t, fx, { title: "Usulan Kelas Prompt", kind: "usulan" });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  expect(new Set(postHits(hits).map((h) => h.postKind))).toEqual(
    new Set(["sumber", "pengumuman", "usulan"])
  );
});

test("posts are tenant-scoped: another tenant's matching rows never leak", async () => {
  const { t, fx } = await fixture();
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedPost(t, other, { title: "Prompt Milik Tetangga", kind: "sumber" });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  expect(postHits(hits).some((h) => /Tetangga/.test(h.title))).toBe(false);
});

test("post hits are bounded at 10 even when more rows match", async () => {
  const { t, fx } = await fixture();
  for (let i = 0; i < 14; i++) {
    await seedPost(t, fx, { title: `Koleksi Prompt ${i}`, kind: "sumber" });
  }
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  expect(postHits(hits)).toHaveLength(10); // 14 Koleksi + 1 Panduan match; cap wins
});

test("no title match → no post hits (other kinds unaffected)", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(postHits(hits)).toHaveLength(0);
});
