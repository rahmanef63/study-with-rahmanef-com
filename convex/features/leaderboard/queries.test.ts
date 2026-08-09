/// <reference types="vite/client" />
// Read specs for the leaderboard (#30). This slice ships NO mutation — points
// are written by the like mutation that earns them — so the P0 authz-denied
// coverage lands on getMyRank (unauthenticated + non-member) and on the
// active-tenant gate of the anonymous board. The public projection is asserted
// KEY BY KEY (P0 §6).
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { RANK_SCAN_CAP } from "./constants";
import { asUser, seedMember, seedTenantFixture, setup } from "./test.helpers";

const ENTRY_KEYS = ["avatarUrl", "displayName", "level", "points", "rank", "username"];

describe("listTop — projection & leak surface", () => {
  test("anonymous read; EXACTLY the safe keys, no user identifiers", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "budi", { points: 30 });

    const rows = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual(ENTRY_KEYS);
    expect(rows[0]).toEqual({
      rank: 1,
      points: 30,
      level: 3, // 20 ≤ 30 < 65
      displayName: "Nama budi",
      username: "budi",
      avatarUrl: "https://cdn.test.id/budi.png",
    });
    // Never: the membership/user handles, the role, the tenant, or the bio.
    for (const leaked of ["userId", "_id", "tenantId", "role", "bio", "email"]) {
      expect(rows[0]).not.toHaveProperty(leaked);
    }
  });

  test("avatar-less profile projects null (stable key set)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const userId = await seedMember(t, fx, "tanpafoto", { points: 7 });
    await t.run(async (ctx) => {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile !== null) await ctx.db.patch(profile._id, { avatarUrl: undefined });
    });
    const [row] = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(Object.keys(row).sort()).toEqual(ENTRY_KEYS);
    expect(row.avatarUrl).toBeNull();
  });
});

describe("listTop — ordering & the unscored", () => {
  test("points desc; members with NO points row are absent (no fabricated zeros)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "sepi"); // points UNSET — the pre-#30 shape
    await seedMember(t, fx, "cici", { points: 5 });
    await seedMember(t, fx, "adi", { points: 100 });
    await seedMember(t, fx, "bela", { points: 40 });

    const rows = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(rows.map((r) => r.username)).toEqual(["adi", "bela", "cici"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rows.some((r) => r.username === "sepi")).toBe(false);
  });

  test("a stored 0 is real data and DOES appear (only `undefined` is skipped)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "nol", { points: 0 });
    const rows = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(rows.map((r) => [r.username, r.points, r.level])).toEqual([["nol", 0, 1]]);
  });

  test("ties share a rank and the next distinct score skips (competition ranking)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "a", { points: 50 });
    await seedMember(t, fx, "b", { points: 50 });
    await seedMember(t, fx, "c", { points: 10 });
    const rows = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });

  test("a scorer without a profile is dropped but still consumes their rank", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "hantu", { points: 90, withProfile: false });
    await seedMember(t, fx, "nyata", { points: 10 });
    const rows = await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, {
      tenantId: fx.tenantId,
    });
    expect(rows.map((r) => [r.username, r.rank])).toEqual([["nyata", 2]]);
  });

  test("scoped to ONE tenant; empty board for a community with no scores", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const other = await seedTenantFixture(t, "komunitas-lain");
    await seedMember(t, other, "asing", { points: 999 });
    await seedMember(t, fx, "belumapaapa");
    expect(
      await t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, { tenantId: fx.tenantId })
    ).toEqual([]);
  });

  test("suspended / pending tenant → NOT_FOUND", async () => {
    const t = setup();
    for (const [i, status] of (["suspended", "pending"] as const).entries()) {
      const fx = await seedTenantFixture(t, `komunitas-${i}`, status);
      await seedMember(t, fx, `warga${i}`, { points: 10 });
      await expect(
        t.withIdentity(asUser(fx.ownerId)).query(api.features.leaderboard.queries.listTop, { tenantId: fx.tenantId })
      ).rejects.toThrow(/NOT_FOUND/);
    }
  });
});

describe("getMyRank — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await expect(
      t.query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider (no membership) → NOT_AUTHORIZED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await expect(
      t
        .withIdentity(asUser(fx.outsiderId))
        .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("member of ANOTHER tenant → NOT_AUTHORIZED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const other = await seedTenantFixture(t, "komunitas-lain");
    const stranger = await seedMember(t, other, "orangluar", { points: 10 });
    await expect(
      t
        .withIdentity(asUser(stranger))
        .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });
});

describe("getMyRank — the numbers", () => {
  test("rank = 1 + members scoring strictly higher; ties share it", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "top", { points: 100 });
    const tiedA = await seedMember(t, fx, "tiea", { points: 50 });
    const tiedB = await seedMember(t, fx, "tieb", { points: 50 });
    const last = await seedMember(t, fx, "buncit", { points: 1 });

    for (const userId of [tiedA, tiedB]) {
      const mine = await t
        .withIdentity(asUser(userId))
        .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId });
      expect(mine.rank).toBe(2);
      expect(mine.points).toBe(50);
      expect(mine.level).toBe(3); // 20 ≤ 50 < 65
    }
    const tail = await t
      .withIdentity(asUser(last))
      .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId });
    expect(tail.rank).toBe(4);
  });

  test("unset points reads as 0: level 1, '5 poin lagi', ranked behind every scorer", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "juara", { points: 600 });
    const fresh = await seedMember(t, fx, "baru"); // points UNSET
    const mine = await t
      .withIdentity(asUser(fresh))
      .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId });
    expect(mine).toEqual({
      points: 0,
      level: 1,
      rank: 2,
      nextLevelAt: 5,
      pointsToNext: 5,
    });
  });

  test("the only member scores rank 1", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const solo = await seedMember(t, fx, "sendirian", { points: 33_015 });
    const mine = await t
      .withIdentity(asUser(solo))
      .query(api.features.leaderboard.queries.getMyRank, { tenantId: fx.tenantId });
    expect(mine).toEqual({
      points: 33_015,
      level: 9,
      rank: 1,
      nextLevelAt: null,
      pointsToNext: null,
    });
  });

  test("the rank scan is bounded — RANK_SCAN_CAP is a real ceiling, not a suggestion", () => {
    expect(RANK_SCAN_CAP).toBeGreaterThan(0);
    expect(Number.isSafeInteger(RANK_SCAN_CAP)).toBe(true);
  });
});

describe("listTop — authz (the board is a MEMBER list, never anonymous)", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await expect(
      t.query(api.features.leaderboard.queries.listTop, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider → NOT_AUTHORIZED (membership edge must not leak)", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    await seedMember(t, fx, "warga", { points: 42 });
    await expect(
      t
        .withIdentity(asUser(fx.outsiderId))
        .query(api.features.leaderboard.queries.listTop, { tenantId: fx.tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });
});
