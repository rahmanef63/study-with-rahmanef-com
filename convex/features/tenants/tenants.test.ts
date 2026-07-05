/// <reference types="vite/client" />
// tenants convex layer — full coverage per DoD §5.2: every query/mutation
// including authz-denied paths, plus the P0 "webhook never leaks" contract.
// Pattern: convex/seed.test.ts (modules glob + convex-test + denied paths).
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

const WEBHOOK = "https://discord.com/api/webhooks/123456789/abcDEF_ghi-JKL";

/** Seed one tenant (+owner user/profile/membership) and one plain user. */
async function seed(t: ReturnType<typeof convexTest>, status: "active" | "pending" | "suspended" = "active") {
  return t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@example.com" });
    await ctx.db.insert("profiles", {
      userId: ownerId,
      username: "owner",
      displayName: "Owner",
    });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "belajar-ai",
      name: "Belajar AI",
      description: "Komunitas belajar pengaplikasian AI.",
      track: "umum",
      discordInviteUrl: "https://discord.gg/abc123",
      discordWebhookUrl: WEBHOOK,
      status,
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    const userId = await ctx.db.insert("users", { email: "user@example.com" });
    await ctx.db.insert("profiles", {
      userId,
      username: "budi",
      displayName: "Budi",
    });
    return { ownerId, userId, tenantId };
  });
}

const as = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|test-session` });

function expectNoWebhook(value: unknown) {
  expect(JSON.stringify(value)).not.toContain("webhook");
  expect(JSON.stringify(value)).not.toContain(WEBHOOK);
}

describe("queries.getPublicBySlug", () => {
  test("returns the safe projection for an active tenant (P0: no webhook)", async () => {
    const t = convexTest(schema, modules);
    await seed(t);
    const result = await t.query(api.features.tenants.queries.getPublicBySlug, {
      slug: "belajar-ai",
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Belajar AI");
    expect(result!.discordInviteUrl).toBe("https://discord.gg/abc123");
    expect(result).not.toHaveProperty("discordWebhookUrl");
    expect(result).not.toHaveProperty("ownerId");
    expect(result).not.toHaveProperty("requestMessage");
    expectNoWebhook(result);
  });

  test.each(["pending", "suspended"] as const)("%s tenant reads as null (R6)", async (status) => {
    const t = convexTest(schema, modules);
    await seed(t, status);
    const result = await t.query(api.features.tenants.queries.getPublicBySlug, {
      slug: "belajar-ai",
    });
    expect(result).toBeNull();
  });

  test("unknown slug reads as null", async () => {
    const t = convexTest(schema, modules);
    const result = await t.query(api.features.tenants.queries.getPublicBySlug, {
      slug: "nope",
    });
    expect(result).toBeNull();
  });
});

describe("queries.listActive", () => {
  test("lists only active tenants, safe shape, bounded", async () => {
    const t = convexTest(schema, modules);
    const { ownerId } = await seed(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("tenants", {
        slug: "pending-one",
        name: "Pending",
        description: "Belum aktif.",
        status: "pending",
        ownerId,
      });
    });
    const result = await t.query(api.features.tenants.queries.listActive, {});
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("belajar-ai");
    expectNoWebhook(result);
    const limited = await t.query(api.features.tenants.queries.listActive, { limit: 1 });
    expect(limited).toHaveLength(1);
  });
});

describe("queries.getManageView", () => {
  test("denies unauthenticated and non-owner callers", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId } = await seed(t);
    await expect(
      t.query(api.features.tenants.queries.getManageView, { tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, userId).query(api.features.tenants.queries.getManageView, { tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/); // not a member
    await as(t, userId).mutation(api.features.tenants.mutations.join, { tenantId });
    await expect(
      as(t, userId).query(api.features.tenants.queries.getManageView, { tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/); // member but not owner
  });

  test("owner sees hasDiscordWebhook flag but never the URL (P0)", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seed(t);
    const view = await as(t, ownerId).query(api.features.tenants.queries.getManageView, {
      tenantId,
    });
    expect(view!.hasDiscordWebhook).toBe(true);
    expect(view!.status).toBe("active");
    expect(view).not.toHaveProperty("discordWebhookUrl");
    expectNoWebhook(view);
  });
});

describe("members.getMyMembership / members.listMembers", () => {
  test("getMyMembership: denied unauthenticated; null for non-member; role for member", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId, userId } = await seed(t);
    await expect(
      t.query(api.features.tenants.members.getMyMembership, { tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    expect(
      await as(t, userId).query(api.features.tenants.members.getMyMembership, { tenantId })
    ).toBeNull();
    const mine = await as(t, ownerId).query(api.features.tenants.members.getMyMembership, {
      tenantId,
    });
    expect(mine!.role).toBe("owner");
  });

  test("listMembers: denied unauthenticated + non-member; members get roster with profiles", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId } = await seed(t);
    await expect(
      t.query(api.features.tenants.members.listMembers, { tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, userId).query(api.features.tenants.members.listMembers, { tenantId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await as(t, userId).mutation(api.features.tenants.mutations.join, { tenantId });
    const roster = await as(t, userId).query(api.features.tenants.members.listMembers, {
      tenantId,
    });
    expect(roster).toHaveLength(2);
    const budi = roster.find((m: { username?: string }) => m.username === "budi");
    expect(budi!.role).toBe("member");
    expect(budi!.displayName).toBe("Budi");
    expectNoWebhook(roster);
  });
});

describe("mutations.join", () => {
  test("denies unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    const { tenantId } = await seed(t);
    await expect(
      t.mutation(api.features.tenants.mutations.join, { tenantId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test.each(["pending", "suspended"] as const)("rejects joining a %s tenant", async (status) => {
    const t = convexTest(schema, modules);
    const { tenantId, userId } = await seed(t, status);
    await expect(
      as(t, userId).mutation(api.features.tenants.mutations.join, { tenantId })
    ).rejects.toThrow(/NOT_FOUND/);
  });

  test("joins as member, idempotently; never demotes an existing role", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId, ownerId } = await seed(t);
    const first = await as(t, userId).mutation(api.features.tenants.mutations.join, { tenantId });
    expect(first).toEqual({ joined: true, role: "member" });
    const second = await as(t, userId).mutation(api.features.tenants.mutations.join, { tenantId });
    expect(second).toEqual({ joined: false, role: "member" });
    const ownerJoin = await as(t, ownerId).mutation(api.features.tenants.mutations.join, { tenantId });
    expect(ownerJoin).toEqual({ joined: false, role: "owner" });
    await t.run(async (ctx) => {
      const all = await ctx.db.query("memberships").collect();
      expect(all).toHaveLength(2); // owner + budi, no duplicates
    });
  });
});
