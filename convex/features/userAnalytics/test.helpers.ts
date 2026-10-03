/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../../schema";

const modules = import.meta.glob(["/convex/**/*.{js,ts}", "!/convex/**/*.test.ts", "!/convex/**/*.d.ts"]);
export const identity = (userId: string) => ({ subject: `${userId}|test-session` });
export const NOW = Date.parse("2026-10-03T12:00:00Z");
export const SECRET = "a".repeat(64);

export async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async ctx => {
    const admin = await ctx.db.insert("users", { email: "admin@example.test" });
    const member = await ctx.db.insert("users", { email: "member@example.test" });
    const owner = await ctx.db.insert("users", { email: "owner@example.test" });
    const outsider = await ctx.db.insert("users", { email: "outsider@example.test" });
    for (const [userId, username] of [[admin, "admin"], [member, "member"], [owner, "owner"]] as const) {
      await ctx.db.insert("profiles", { userId, username, displayName: username, ...(userId === admin ? { isPlatformAdmin: true } : {}) });
    }
    const tenantId = await ctx.db.insert("tenants", { ownerId: owner, slug: "fixture", name: "Fixture", description: "", status: "active", discordWebhookUrl: "https://secret.example.test" });
    await ctx.db.insert("memberships", { tenantId, userId: owner, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: member, role: "member" });
    const courseId = await ctx.db.insert("courses", { tenantId, createdBy: owner, slug: "dasar", title: "Dasar", description: "", status: "published" });
    const lessonId = await ctx.db.insert("lessons", { tenantId, slug: "dasar-ai", title: "Dasar AI", contentMd: "", links: [], status: "published" });
    await ctx.db.insert("courseLessons", { tenantId, courseId, lessonId, order: 0, lessonPublished: true });
    const quizId = await ctx.db.insert("quizzes", { tenantId, courseId, title: "Kuis", passingScorePct: 50, questions: [{ prompt: "?", options: ["A", "B"], correctIndex: 1, explanation: "SECRET_ANSWER" }] });
    return { admin, member, owner, outsider, tenantId, courseId, lessonId, quizId };
  });
  return { t, ids, admin: t.withIdentity(identity(ids.admin)), member: t.withIdentity(identity(ids.member)) };
}
