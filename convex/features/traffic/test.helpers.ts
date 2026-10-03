/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../../schema";

export const modules = import.meta.glob(["/convex/**/*.{js,ts}", "!/convex/**/*.test.ts", "!/convex/**/*.d.ts"]);
export const setup = () => convexTest(schema, modules);
export type T = ReturnType<typeof setup>;
export const NOW = Date.parse("2026-10-03T12:00:00Z");
export const SECRET = "a".repeat(64);
export const payload = (changes: Record<string, unknown> = {}) => ({
  path: "/", sessionId: "1234567890abcdef", kind: "page" as const,
  viewport: "desktop" as const, bucket: "b".repeat(64), ...changes,
});
export const identity = (userId: string) => ({ subject: `${userId}|test-session` });
export async function fixture() {
  const t = setup();
  const ids = await t.run(async ctx => {
    const admin = await ctx.db.insert("users", { email: "admin@example.test" });
    const member = await ctx.db.insert("users", { email: "member@example.test" });
    const instructor = await ctx.db.insert("users", { email: "instructor@example.test" });
    const owner = await ctx.db.insert("users", { email: "owner@example.test" });
    await ctx.db.insert("profiles", { userId: admin, username: "admin", displayName: "Admin", isPlatformAdmin: true });
    const tenantId = await ctx.db.insert("tenants", { ownerId: owner, slug: "fixture", name: "Fixture", description: "", status: "active" });
    for (const [userId, role] of [[member, "member"], [instructor, "instructor"], [owner, "owner"]] as const) {
      await ctx.db.insert("memberships", { tenantId, userId, role });
    }
    return { admin, member, instructor, owner };
  });
  return { t, ids, admin: t.withIdentity(identity(ids.admin)) };
}
export async function tableSizes(t: T) {
  return t.run(async ctx => ({
    events: (await ctx.db.query("trafficEvents").withIndex("by_at").take(10)).length,
    budgets: (await ctx.db.query("trafficBudgets").withIndex("by_day").take(10)).length,
    rates: (await ctx.db.query("trafficRateLimits").withIndex("by_bucket").take(10)).length,
  }));
}
