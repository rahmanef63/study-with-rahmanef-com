/// <reference types="vite/client" />
// Resource-source specs (#29) — the P0 invariants of the third search source:
// approved-only (pending/rejected NEVER appear), tenant-scoped, bounded ≤10,
// case-insensitive in-memory title match. Shape exactness: projection.test.ts.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedResource, seedTenantFixture, setup } from "./test.helpers";

const fn = api.features.search.queries.searchInTenant;

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedResource(t, fx, {
    status: "approved",
    title: "Panduan Prompt Engineering",
    url: "https://contoh.id/panduan-prompt",
  });
  await seedResource(t, fx, {
    status: "pending",
    title: "Prompt Rahasia Masih Pending",
    url: "https://contoh.id/pending",
  });
  await seedResource(t, fx, {
    status: "rejected",
    title: "Prompt Ditolak Moderator",
    url: "https://contoh.id/ditolak",
  });
  return { t, fx };
}

function resourceHits(hits: Array<{ kind: string }>) {
  return hits.filter((h) => h.kind === "resource") as Array<{
    kind: "resource";
    title: string;
    url: string;
  }>;
}

test("member finds APPROVED resource; match is case-insensitive contains", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "PROMPT engineering" });
  // NOTE: exact full-substring match on purpose — "prompt" alone would also
  // hit; this asserts the lowercase-contains path, not tokenization.
  const res = resourceHits(hits);
  expect(res).toHaveLength(1);
  expect(res[0].title).toBe("Panduan Prompt Engineering");
  expect(res[0].url).toBe("https://contoh.id/panduan-prompt");
});

test("pending and rejected resources NEVER appear (P0)", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  const res = resourceHits(hits);
  expect(res).toHaveLength(1); // only the approved one
  expect(res.some((h) => /Pending|Ditolak/.test(h.title))).toBe(false);
  expect(res.some((h) => /pending|ditolak/.test(h.url))).toBe(false);
});

test("resources are tenant-scoped: approved rows of another tenant never leak", async () => {
  const { t, fx } = await fixture();
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedResource(t, other, {
    status: "approved",
    title: "Prompt Milik Tetangga",
    url: "https://contoh.id/tetangga",
  });
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  expect(resourceHits(hits).some((h) => h.url === "https://contoh.id/tetangga")).toBe(false);
});

test("resource hits are bounded at 10 even when more approved rows match", async () => {
  const { t, fx } = await fixture();
  for (let i = 0; i < 14; i++) {
    await seedResource(t, fx, {
      status: "approved",
      title: `Koleksi Prompt ${i}`,
      url: `https://contoh.id/koleksi-${i}`,
    });
  }
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "prompt" });
  const res = resourceHits(hits);
  expect(res.length).toBeLessThanOrEqual(10);
  expect(res.length).toBe(10); // 14 Koleksi + 1 Panduan match; cap wins
});

test("no title match → no resource hits (other kinds unaffected)", async () => {
  const { t, fx } = await fixture();
  const hits = await t
    .withIdentity(asUser(fx.memberId))
    .query(fn, { tenantId: fx.tenantId, q: "fotosintesis" });
  expect(resourceHits(hits)).toHaveLength(0);
});
