/// <reference types="vite/client" />
// Shared fixture for asisten convex-test specs (pattern: search/test.helpers.ts
// — duplicated per feature; only _shared is common ground).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

export const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

export function setup() {
  return convexTest(schema, modules);
}

export type T = ReturnType<typeof setup>;

/** @convex-dev/auth identity: JWT subject is `${userId}|${sessionId}`. */
export function asUser(userId: Id<"users">) {
  return { subject: `${userId}|test-session` };
}

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + owner/member/outsider (outsider TANPA membership). */
export async function seedTenantFixture(t: T): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec asisten",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, memberId, outsiderId };
  });
}

/** Course (status configurable) + 1 modul + 1 lesson dengan konten terkontrol. */
export async function seedLesson(
  t: T,
  fx: TenantFixture,
  opts?: { status?: "draft" | "published" | "archived"; contentMd?: string }
): Promise<{ lessonId: Id<"lessons">; courseId: Id<"courses"> }> {
  return await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: "kelas-asisten",
      title: "Kelas Asisten",
      description: "fixture",
      status: opts?.status ?? "published",
      createdBy: fx.ownerId,
    });
    const moduleId = await ctx.db.insert("modules", {
      tenantId: fx.tenantId,
      courseId,
      title: "Modul 1",
      order: 1,
    });
    const lessonId = await ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      courseId,
      moduleId,
      title: "Materi Fotosintesis",
      contentMd: opts?.contentMd ?? "Fotosintesis mengubah cahaya menjadi energi.",
      links: [],
      order: 1,
    });
    return { lessonId, courseId };
  });
}

/** Response Anthropic Messages API yang sukses, dengan teks yang ditentukan. */
export function anthropicOk(text: string): Response {
  return new Response(
    JSON.stringify({ content: [{ type: "text", text }] }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
