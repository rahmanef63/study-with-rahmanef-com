import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";

const modules = import.meta.glob(["/convex/**/*.{js,ts}", "!/convex/**/*.test.ts", "!/convex/**/*.d.ts"]);

test.each(["pending", "suspended"] as const)("%s communities deny existing members and owners while admins can restore access", async (status) => {
  const t = convexTest(schema, modules);
  const { tenantId, userId } = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const tenantId = await ctx.db.insert("tenants", {
      slug: "access-check", name: "Access check", description: "Fixture", status, ownerId: userId,
    });
    await ctx.db.insert("memberships", { tenantId, userId, role: "owner" });
    await ctx.db.insert("profiles", {
      userId, username: "access-check", displayName: "Access check", isPlatformAdmin: true,
    });
    return { tenantId, userId };
  });
  const owner = t.withIdentity({ subject: `${userId}|test-session` });
  await expect(t.query(api.features.tenants.members.listMembers, { tenantId })).rejects.toMatchObject({
    data: { code: "NOT_AUTHENTICATED" },
  });
  await expect(owner.query(api.features.tenants.members.listMembers, { tenantId })).rejects.toMatchObject({
    data: { code: "NOT_FOUND" },
  });
  await expect(owner.mutation(api.features.tenants.mutations.updateProfile, { tenantId, name: "Changed" })).rejects.toMatchObject({
    data: { code: "NOT_FOUND" },
  });
  expect(await t.run(async (ctx) => (await ctx.db.get(tenantId))?.name)).toBe("Access check");
  await owner.mutation(api.features.tenants.admin.approve, { tenantId });
  expect(await owner.query(api.features.tenants.members.listMembers, { tenantId })).toHaveLength(1);
  await expect(owner.mutation(api.features.tenants.mutations.updateProfile, { tenantId, name: "Restored" })).resolves.toMatchObject({ name: "Restored" });
});
