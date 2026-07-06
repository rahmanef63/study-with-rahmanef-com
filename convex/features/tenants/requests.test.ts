/// <reference types="vite/client" />
// tenants convex layer — community request flow (#6). Covers the authz-denied
// path, slug validation + collision, and the 1-pending anti-spam cap.
// Pattern: convex/features/tenants/tenants.test.ts (modules glob + denied paths).
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

const as = (t: ReturnType<typeof convexTest>, userId: Id<"users">) =>
  t.withIdentity({ subject: `${userId}|test-session` });

/** A plain requester + a separate active tenant already occupying "belajar-ai". */
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
    return { ownerId, tenantId, userId };
  });
}

const validArgs = {
  slug: "komunitas-baru",
  name: "Komunitas Baru",
  description: "Komunitas belajar dengan deskripsi yang cukup panjang.",
  track: "umum",
  requestMessage: "Ingin membuka ruang belajar.",
};

describe("mutations.requestTenant", () => {
  test("denies unauthenticated callers", async () => {
    const t = convexTest(schema, modules);
    await seed(t);
    await expect(
      t.mutation(api.features.tenants.requests.requestTenant, validArgs)
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("creates a pending tenant owned by the caller; grants no membership yet", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    const result = await as(t, userId).mutation(
      api.features.tenants.requests.requestTenant,
      validArgs
    );
    expect(result.status).toBe("pending");
    expect(result.slug).toBe("komunitas-baru");
    await t.run(async (ctx) => {
      const row = await ctx.db.get(result.tenantId as Id<"tenants">);
      expect(row!.status).toBe("pending");
      expect(row!.ownerId).toBe(userId);
      expect(row!.requestMessage).toBe("Ingin membuka ruang belajar.");
      // Ownership membership is created at approve, never at request time.
      const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      expect(memberships).toHaveLength(0);
    });
  });

  test("normalizes slug case (Kebab-Case → kebab-case)", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    const result = await as(t, userId).mutation(
      api.features.tenants.requests.requestTenant,
      { ...validArgs, slug: "Komunitas-Baru" }
    );
    expect(result.slug).toBe("komunitas-baru");
  });

  test.each([
    ["space in slug", { slug: "komunitas baru" }],
    ["underscore in slug", { slug: "komunitas_baru" }],
    ["slug too short", { slug: "ab" }],
    ["name too short", { name: "ab" }],
    ["description too short", { description: "pendek" }],
  ] as const)("rejects invalid input (%s) with VALIDATION_FAILED", async (_label, patch) => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    await expect(
      as(t, userId).mutation(api.features.tenants.requests.requestTenant, {
        ...validArgs,
        ...patch,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test("rejects a slug already taken by any tenant (VALIDATION_FAILED)", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    await expect(
      as(t, userId).mutation(api.features.tenants.requests.requestTenant, {
        ...validArgs,
        slug: "belajar-ai", // occupied by the active tenant in seed
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test("enforces one pending request per user (RATE_LIMITED); other users unaffected", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    await as(t, userId).mutation(api.features.tenants.requests.requestTenant, validArgs);
    await expect(
      as(t, userId).mutation(api.features.tenants.requests.requestTenant, {
        ...validArgs,
        slug: "komunitas-kedua",
        name: "Komunitas Kedua",
      })
    ).rejects.toThrow(/RATE_LIMITED/);

    const otherId = await t.run(
      async (ctx) => await ctx.db.insert("users", { email: "other@example.com" })
    );
    const ok = await as(t, otherId).mutation(api.features.tenants.requests.requestTenant, {
      ...validArgs,
      slug: "komunitas-lain",
      name: "Komunitas Lain",
    });
    expect(ok.status).toBe("pending");
  });
});
