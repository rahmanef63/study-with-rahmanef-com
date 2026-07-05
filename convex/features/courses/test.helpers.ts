/// <reference types="vite/client" />
// Shared fixture for courses convex-test specs (pattern: convex/seed.test.ts).
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// convex-test needs every function module of the convex/ directory; the
// "_generated" key in this glob anchors path normalization (prefix "../../").
export const modules = import.meta.glob([
  "../../**/*.{js,ts}",
  "!../../**/*.test.ts",
  "!../../**/*.d.ts",
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
  instructorId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(t: T): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec courses",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type CourseFixture = {
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  lessonId: Id<"lessons">;
};

/** Course + 1 module + 1 lesson, in the given status, owned by the fixture instructor. */
export async function seedCourse(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived",
  slug = `kelas-${status}`
): Promise<CourseFixture> {
  return await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug,
      title: `Kelas ${status}`,
      description: "Deskripsi kelas fixture",
      status,
      createdBy: fx.instructorId,
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
      title: "Lesson 1",
      youtubeVideoId: "dQw4w9WgXcQ",
      contentMd: "# Halo\n\nMateri pertama.",
      links: [{ label: "Dokumentasi", url: "https://example.com/docs" }],
      order: 1,
    });
    return { courseId, moduleId, lessonId };
  });
}
