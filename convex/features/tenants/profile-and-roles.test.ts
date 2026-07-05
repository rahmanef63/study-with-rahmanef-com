/// <reference types="vite/client" />
// tenants convex layer — updateProfile (webhook write-only P0) + setMemberRole.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

const raw = import.meta.glob(["../../**/*.{js,ts}", "!../../**/*.test.ts", "!../../**/*.d.ts"]);
const modules = Object.fromEntries(
  Object.entries(raw).map(([k, v]) => [k.replace(/^(\.\.\/)+/, "./"), v])
);

const WEBHOOK = "https://discord.com/api/webhooks/123456789/abcDEF_ghi-JKL";

async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@example.com" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "belajar-ai",
      name: "Belajar AI",
      description: "Komunitas belajar pengaplikasian AI.",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    const userId = await ctx.db.insert("users", { email: "user@example.com" });
    await ctx.db.insert("memberships", { tenantId, userId, role: "member" });
    return { ownerId, userId, tenantId };
  });
}

const as = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|test-session` });

describe("mutations.updateProfile", () => {
  test("denies unauthenticated and non-owner callers", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId } = await seed(t);
    await expect(
      t.mutation(api.features.tenants.mutations.updateProfile, { tenantId, name: "X Y Z" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, userId).mutation(api.features.tenants.mutations.updateProfile, {
        tenantId,
        name: "Nama Baru",
      })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("owner updates fields; result and stored row behave per contract", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seed(t);
    const result = await as(t, ownerId).mutation(api.features.tenants.mutations.updateProfile, {
      tenantId,
      name: "Belajar AI v2",
      description: "Deskripsi baru yang cukup panjang.",
      track: "kerja",
      discordInviteUrl: "https://discord.gg/xyz789",
      discordWebhookUrl: WEBHOOK,
    });
    // Webhook accepted (write-only): flag true, URL absent from the response.
    expect(result.hasDiscordWebhook).toBe(true);
    expect(result.name).toBe("Belajar AI v2");
    expect(JSON.stringify(result)).not.toContain(WEBHOOK);
    // Stored for the server-side Discord action to read later.
    await t.run(async (ctx) => {
      const row = await ctx.db.get(tenantId);
      expect(row!.discordWebhookUrl).toBe(WEBHOOK);
      expect(row!.track).toBe("kerja");
    });
  });

  test('"" clears optional fields; omitted fields stay unchanged', async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seed(t);
    await as(t, ownerId).mutation(api.features.tenants.mutations.updateProfile, {
      tenantId,
      track: "umum",
      discordInviteUrl: "https://discord.gg/abc123",
      discordWebhookUrl: WEBHOOK,
    });
    const cleared = await as(t, ownerId).mutation(
      api.features.tenants.mutations.updateProfile,
      { tenantId, track: "", discordWebhookUrl: "" }
    );
    expect(cleared.track).toBeUndefined();
    expect(cleared.hasDiscordWebhook).toBe(false);
    expect(cleared.discordInviteUrl).toBe("https://discord.gg/abc123"); // untouched
    await t.run(async (ctx) => {
      const row = await ctx.db.get(tenantId);
      expect(row!.discordWebhookUrl).toBeUndefined();
      expect(row!.track).toBeUndefined();
    });
  });

  test.each([
    ["name", { name: "ab" }],
    ["description", { description: "pendek" }],
    ["discordInviteUrl", { discordInviteUrl: "https://evil.example.com/invite" }],
    ["discordWebhookUrl", { discordWebhookUrl: "https://evil.example.com/api/webhooks/1/x" }],
  ] as const)("rejects invalid %s with VALIDATION_FAILED", async (_field, patch) => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seed(t);
    await expect(
      as(t, ownerId).mutation(api.features.tenants.mutations.updateProfile, {
        tenantId,
        ...patch,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("mutations.setMemberRole", () => {
  test("denies unauthenticated, member, and instructor callers", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId, ownerId } = await seed(t);
    await expect(
      t.mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: userId,
        role: "instructor",
      })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, userId).mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: userId,
        role: "instructor",
      })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    // Promote budi to instructor, then verify instructor still cannot set roles.
    await as(t, ownerId).mutation(api.features.tenants.mutations.setMemberRole, {
      tenantId,
      targetUserId: userId,
      role: "instructor",
    });
    const otherId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { email: "other@example.com" });
      await ctx.db.insert("memberships", { tenantId, userId: id, role: "member" });
      return id;
    });
    await expect(
      as(t, userId).mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: otherId,
        role: "instructor",
      })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("owner promotes and demotes member ↔ instructor", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, userId, ownerId } = await seed(t);
    const promoted = await as(t, ownerId).mutation(
      api.features.tenants.mutations.setMemberRole,
      { tenantId, targetUserId: userId, role: "instructor" }
    );
    expect(promoted.role).toBe("instructor");
    const demoted = await as(t, ownerId).mutation(
      api.features.tenants.mutations.setMemberRole,
      { tenantId, targetUserId: userId, role: "member" }
    );
    expect(demoted.role).toBe("member");
  });

  test("owner rows are untouchable; self-change and unknown targets rejected", async () => {
    const t = convexTest(schema, modules);
    const { tenantId, ownerId } = await seed(t);
    await expect(
      as(t, ownerId).mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: ownerId,
        role: "member",
      })
    ).rejects.toThrow(/VALIDATION_FAILED/); // self
    const coOwnerId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", { email: "co@example.com" });
      await ctx.db.insert("memberships", { tenantId, userId: id, role: "owner" });
      return id;
    });
    await expect(
      as(t, ownerId).mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: coOwnerId,
        role: "member",
      })
    ).rejects.toThrow(/NOT_AUTHORIZED/); // another owner's row
    const strangerId = await t.run(
      async (ctx) => await ctx.db.insert("users", { email: "stranger@example.com" })
    );
    await expect(
      as(t, ownerId).mutation(api.features.tenants.mutations.setMemberRole, {
        tenantId,
        targetUserId: strangerId,
        role: "instructor",
      })
    ).rejects.toThrow(/NOT_FOUND/); // no membership
  });
});
