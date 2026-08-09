/// <reference types="vite/client" />
// Read-surface specs (v1.8 #29). The ANONYMOUS etalase contract (AGENTS.md §6)
// is asserted KEY-BY-KEY and again over the serialized payload: no "userId",
// no "email", no id beyond the post's own. Plus feed ordering, the deleted /
// suspended-tenant exclusions, and the listMine "kiriman saya hilang"
// regression the retired boards had.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, FIRST_PAGE, seedPost, seedProfile, seedTenantFixture, setup } from "./test.helpers";

const PUBLIC_KEYS = [
  "_id",
  "kind",
  "title",
  "bodyMd",
  "linkUrl",
  "youtubeVideoId",
  "pinned",
  "likeCount",
  "commentCount",
  "createdAt",
  "author",
].sort();

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedProfile(t, fx.memberId, "budi", "Budi Santoso", "https://cdn.contoh.id/budi.png");
  return { t, fx };
}

describe("publicListFeed — anonymous etalase contract", () => {
  test("safe projection: exact key set, public-profile author only, no ids/PII in the payload", async () => {
    const { t, fx } = await fixture();
    await seedPost(t, fx, fx.memberId, { title: "Post pertama", linkUrl: "https://contoh.id/a" });

    // No identity at all — this is the whole point of the feature.
    const res = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      paginationOpts: FIRST_PAGE,
    });
    expect(res.page).toHaveLength(1);
    const item = res.page[0];
    expect(Object.keys(item).sort()).toEqual(PUBLIC_KEYS);
    expect(item.author).not.toBeNull();
    expect(Object.keys(item.author ?? {}).sort()).toEqual([
      "avatarUrl",
      "displayName",
      "username",
    ]);

    const serialized = JSON.stringify(res);
    expect(serialized).not.toContain("userId");
    expect(serialized).not.toContain("authorId");
    expect(serialized).not.toContain("tenantId");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("deletedAt");
  });

  test("author without a profile row projects author:null (never a bare id)", async () => {
    const { t, fx } = await fixture();
    await seedPost(t, fx, fx.instructorId, { title: "Tanpa profil" });
    const res = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      paginationOpts: FIRST_PAGE,
    });
    expect(res.page[0].author).toBeNull();
  });

  test("pinned first, then lastActivityAt desc; soft-deleted rows excluded", async () => {
    const { t, fx } = await fixture();
    await seedPost(t, fx, fx.memberId, { title: "Lama", lastActivityAt: 1_000 });
    await seedPost(t, fx, fx.memberId, { title: "Baru", lastActivityAt: 9_000 });
    await seedPost(t, fx, fx.memberId, { title: "Disematkan", pinned: true, lastActivityAt: 5 });
    await seedPost(t, fx, fx.memberId, { title: "Dihapus", lastActivityAt: 99_000, deletedAt: 1 });

    const res = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      paginationOpts: FIRST_PAGE,
    });
    expect(res.page.map((p) => p.title)).toEqual(["Disematkan", "Baru", "Lama"]);
  });

  test("kind filter keeps the ordering; cursor pagination walks the whole feed", async () => {
    const { t, fx } = await fixture();
    await seedPost(t, fx, fx.memberId, { title: "Diskusi A", lastActivityAt: 3 });
    await seedPost(t, fx, fx.instructorId, { title: "Pengumuman", kind: "pengumuman", lastActivityAt: 2 });
    await seedPost(t, fx, fx.memberId, { title: "Diskusi B", lastActivityAt: 1 });

    const filtered = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      kind: "diskusi",
      paginationOpts: FIRST_PAGE,
    });
    expect(filtered.page.map((p) => p.title)).toEqual(["Diskusi A", "Diskusi B"]);

    const first = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(first.page.map((p) => p.title)).toEqual(["Diskusi A", "Pengumuman"]);
    const second = await t.query(api.features.posts.queries.publicListFeed, {
      tenantId: fx.tenantId,
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });
    expect(second.page.map((p) => p.title)).toEqual(["Diskusi B"]);
  });

  test("a non-active community is not readable, even by id", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t, "komunitas-dibekukan", "suspended");
    await seedPost(t, fx, fx.memberId, { title: "Rahasia" });
    await expect(
      t.query(api.features.posts.queries.publicListFeed, {
        tenantId: fx.tenantId,
        paginationOpts: FIRST_PAGE,
      })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("publicGetPost", () => {
  test("anonymous permalink read; unknown/deleted → null; suspended tenant → NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { title: "Permalink" });
    const item = await t.query(api.features.posts.queries.publicGetPost, { postId });
    expect(item?.title).toBe("Permalink");
    expect(Object.keys(item ?? {}).sort()).toEqual(PUBLIC_KEYS);
    expect(JSON.stringify(item)).not.toContain("userId");

    const deleted = await seedPost(t, fx, fx.memberId, { title: "Sudah dihapus", deletedAt: 1 });
    expect(await t.query(api.features.posts.queries.publicGetPost, { postId: deleted })).toBeNull();

    const frozen = await seedTenantFixture(t, "komunitas-beku", "suspended");
    const hidden = await seedPost(t, frozen, frozen.memberId, { title: "Rahasia" });
    await expect(
      t.query(api.features.posts.queries.publicGetPost, { postId: hidden })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("listMine", () => {
  test("anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
    const { t, fx } = await fixture();
    await expect(
      t.query(api.features.posts.queries.listMine, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .query(api.features.posts.queries.listMine, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("only the caller's own live posts of THIS tenant, newest first", async () => {
    const { t, fx } = await fixture();
    await seedPost(t, fx, fx.memberId, { title: "Punyaku lama", lastActivityAt: 1 });
    await seedPost(t, fx, fx.memberId, { title: "Punyaku baru", lastActivityAt: 9 });
    await seedPost(t, fx, fx.memberId, { title: "Punyaku dihapus", deletedAt: 1 });
    await seedPost(t, fx, fx.instructorId, { title: "Punya guru" });

    const rows = await t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.posts.queries.listMine, { tenantId: fx.tenantId });
    expect(rows.map((p) => p.title)).toEqual(["Punyaku baru", "Punyaku lama"]);
  });

  test("a post the caller JUST wrote is always in the window (the retired-board bug)", async () => {
    const { t, fx } = await fixture();
    // Noise from other members must not be able to push the caller's own row
    // out of the list — the scan is by_author, not by_tenant.
    for (let i = 0; i < 60; i++) {
      await seedPost(t, fx, fx.instructorId, { title: `Ramai ${i}` });
    }
    const mine = await seedPost(t, fx, fx.memberId, { title: "Kiriman saya" });
    const rows = await t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.posts.queries.listMine, { tenantId: fx.tenantId });
    expect(rows.map((p) => p._id)).toEqual([mine]);
  });
});
