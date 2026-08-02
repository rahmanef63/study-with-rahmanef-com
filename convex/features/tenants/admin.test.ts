/// <reference types="vite/client" />
// tenants convex layer — platform-admin approval queue (#6). Covers denied
// paths for both roles, the P0 "webhook never in results" projection, approve
// idempotency + ensure-owner-membership (and no cross-tenant role), reject →
// suspended keeping requestMessage, and authz-before-read ordering.
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

const as = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|test-session` });

/** admin + requester (owns one pending tenant, webhook set) + a plain non-admin. */
async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const adminId = await ctx.db.insert("users", { email: "admin@example.com" });
    await ctx.db.insert("profiles", {
      userId: adminId,
      username: "admin",
      displayName: "Admin",
      isPlatformAdmin: true,
    });
    const requesterId = await ctx.db.insert("users", { email: "req@example.com" });
    await ctx.db.insert("profiles", {
      userId: requesterId,
      username: "budi",
      displayName: "Budi",
    });
    const pendingId = await ctx.db.insert("tenants", {
      slug: "komunitas-baru",
      name: "Komunitas Baru",
      description: "Deskripsi komunitas yang diajukan.",
      track: "umum",
      requestMessage: "Mohon di-approve ya.",
      discordWebhookUrl: WEBHOOK, // must NEVER surface in listPending (P0)
      status: "pending",
      ownerId: requesterId,
    });
    const plainId = await ctx.db.insert("users", { email: "plain@example.com" });
    await ctx.db.insert("profiles", {
      userId: plainId,
      username: "plain",
      displayName: "Plain",
    });
    return { adminId, requesterId, pendingId, plainId };
  });
}

describe("admin.listPending", () => {
  test("denies unauthenticated + non-admin callers", async () => {
    const t = convexTest(schema, modules);
    const { plainId } = await seed(t);
    await expect(
      t.query(api.features.tenants.admin.listPending, {})
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, plainId).query(api.features.tenants.admin.listPending, {})
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("admin sees pending rows; P0: the webhook never appears in the projection", async () => {
    const t = convexTest(schema, modules);
    const { adminId } = await seed(t);
    const rows = await as(t, adminId).query(api.features.tenants.admin.listPending, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe("komunitas-baru");
    expect(rows[0].requestMessage).toBe("Mohon di-approve ya.");
    expect(rows[0].owner.displayName).toBe("Budi");
    expect(rows[0]).not.toHaveProperty("discordWebhookUrl");
    expect(JSON.stringify(rows)).not.toContain("webhook");
    expect(JSON.stringify(rows)).not.toContain(WEBHOOK);
  });
});

describe("admin.approve", () => {
  test("denies unauthenticated + non-admin callers", async () => {
    const t = convexTest(schema, modules);
    const { plainId, pendingId } = await seed(t);
    await expect(
      t.mutation(api.features.tenants.admin.approve, { tenantId: pendingId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, plainId).mutation(api.features.tenants.admin.approve, { tenantId: pendingId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("activates + grants a single owner membership, idempotently; no other membership", async () => {
    const t = convexTest(schema, modules);
    const { adminId, requesterId, pendingId } = await seed(t);
    const first = await as(t, adminId).mutation(api.features.tenants.admin.approve, {
      tenantId: pendingId,
    });
    expect(first.status).toBe("active");
    // Re-approve: no-op that still guarantees exactly one owner membership.
    await as(t, adminId).mutation(api.features.tenants.admin.approve, { tenantId: pendingId });
    await t.run(async (ctx) => {
      const row = await ctx.db.get(pendingId);
      expect(row!.status).toBe("active");
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", requesterId))
        .collect();
      expect(memberships).toHaveLength(1);
      expect(memberships[0].role).toBe("owner");
      expect(memberships[0].tenantId).toBe(pendingId); // owner only of THIS tenant
    });
  });

  test("authz runs before the read — anonymous + dangling id → NOT_AUTHENTICATED", async () => {
    const t = convexTest(schema, modules);
    const { pendingId } = await seed(t);
    await t.run(async (ctx) => await ctx.db.delete(pendingId));
    await expect(
      t.mutation(api.features.tenants.admin.approve, { tenantId: pendingId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });
});

describe("admin.reject", () => {
  test("denies unauthenticated + non-admin callers", async () => {
    const t = convexTest(schema, modules);
    const { plainId, pendingId } = await seed(t);
    await expect(
      t.mutation(api.features.tenants.admin.reject, { tenantId: pendingId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      as(t, plainId).mutation(api.features.tenants.admin.reject, { tenantId: pendingId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("sets status suspended (no 'rejected' literal), preserves requestMessage, no membership", async () => {
    const t = convexTest(schema, modules);
    const { adminId, pendingId } = await seed(t);
    const result = await as(t, adminId).mutation(api.features.tenants.admin.reject, {
      tenantId: pendingId,
    });
    expect(result.status).toBe("suspended");
    await t.run(async (ctx) => {
      const row = await ctx.db.get(pendingId);
      expect(row!.status).toBe("suspended");
      expect(row!.requestMessage).toBe("Mohon di-approve ya."); // kept for context
      const memberships = await ctx.db.query("memberships").collect();
      expect(memberships).toHaveLength(0); // rejection grants nothing
    });
  });
});

describe("admin.getMyPlatformAdmin", () => {
  test("denies unauthenticated; false for non-admin; true for admin", async () => {
    const t = convexTest(schema, modules);
    const { adminId, plainId } = await seed(t);
    await expect(
      t.query(api.features.tenants.admin.getMyPlatformAdmin, {})
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    expect(
      await as(t, plainId).query(api.features.tenants.admin.getMyPlatformAdmin, {})
    ).toEqual({ isPlatformAdmin: false });
    expect(
      await as(t, adminId).query(api.features.tenants.admin.getMyPlatformAdmin, {})
    ).toEqual({ isPlatformAdmin: true });
  });
});
