/// <reference types="vite/client" />
// Self-contained fixture for progress convex-test specs (pattern:
// convex/features/courses/test.helpers.ts). Progress owns its own fixture — it
// seeds the shared tables via ctx.db directly and never imports the courses
// feature (docs/AGENT-PROMPTS.md epsilon: no cross-slice coupling; tests travel
// with the slice per rr-conventions "Testing").
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Absolute glob rooted at /convex so convex-test resolves nested function paths
// consistently from this nested helper.
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
      description: "Tenant fixture untuk spec progress",
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
  lessonIds: Id<"lessons">[];
};

/** Course + 1 module + `lessonCount` lessons, in the given status. */
export async function seedCourseWithLessons(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived",
  lessonCount: number,
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
    const lessonIds: Id<"lessons">[] = [];
    for (let i = 0; i < lessonCount; i++) {
      lessonIds.push(
        await ctx.db.insert("lessons", {
          tenantId: fx.tenantId,
          courseId,
          moduleId,
          title: `Lesson ${i + 1}`,
          contentMd: "Materi",
          links: [],
          order: i + 1,
        })
      );
    }
    return { courseId, moduleId, lessonIds };
  });
}
