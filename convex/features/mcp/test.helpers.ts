/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { api } from "../../_generated/api";
import schema from "../../schema";
import type { Id } from "../../_generated/dataModel";

const modules = import.meta.glob(["/convex/**/*.{js,ts}", "!/convex/**/*.test.ts", "!/convex/**/*.d.ts"]);
export const identity = (userId: Id<"users">) => ({ subject: `${userId}|test-session` });
export async function setupMcp() {
  const t = convexTest(schema, modules);
  const data = await t.run(async ctx => {
    const adminId = await ctx.db.insert("users", { email: "admin@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const otherId = await ctx.db.insert("users", { email: "other@test.id" });
    const adminProfileId = await ctx.db.insert("profiles", { userId: adminId, username: "admin", displayName: "Admin", isPlatformAdmin: true });
    await ctx.db.insert("profiles", { userId: memberId, username: "member", displayName: "Member" });
    const tenantId = await ctx.db.insert("tenants", { slug: "test", name: "Test", description: "", ownerId: adminId, status: "active" });
    await ctx.db.insert("memberships", { tenantId, userId: adminId, role: "owner" });
    const memberMembershipId = await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    const courseId = await ctx.db.insert("courses", { tenantId, slug: "course", title: "Course", description: "", status: "published", createdBy: adminId });
    const lessonId = await ctx.db.insert("lessons", { tenantId, slug: "lesson", title: "Lesson", contentMd: "# Learning", links: [], status: "published" });
    await ctx.db.insert("courseLessons", { tenantId, courseId, lessonId, order: 1, lessonPublished: true });
    return { adminId, memberId, otherId, tenantId, courseId, lessonId, adminProfileId, memberMembershipId };
  });
  const admin = t.withIdentity(identity(data.adminId)), member = t.withIdentity(identity(data.memberId)), other = t.withIdentity(identity(data.otherId));
  const userToken = await member.action(api.features.mcp.tokens.issue, { scope: "user", label: "Member client", ttlDays: 7 });
  const adminToken = await admin.action(api.features.mcp.tokens.issue, { scope: "admin", label: "Admin client", ttlDays: 30 });
  return { t, ...data, admin, member, other, userToken, adminToken };
}
