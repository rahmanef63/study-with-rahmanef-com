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
  lessonIds: Id<"lessons">[];
};

/**
 * Course + `lessonCount` materi PLACED in it via `courseLessons`.
 * A materi is tenant-owned (DECISIONS #36/#37); the placement row is what makes
 * the course teach it. Same shape as seedMateri + placeLesson below, just in
 * one call.
 */
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
    const lessonIds: Id<"lessons">[] = [];
    for (let i = 0; i < lessonCount; i++) {
      const lessonId = await ctx.db.insert("lessons", {
        tenantId: fx.tenantId,
        slug: `${slug}-materi-${i + 1}`,
        status: "published",
        title: `Lesson ${i + 1}`,
        contentMd: "Materi",
        links: [],
      });
      await ctx.db.insert("courseLessons", {
        tenantId: fx.tenantId,
        courseId,
        lessonId,
        order: i + 1,
      });
      lessonIds.push(lessonId);
    }
    return { courseId, lessonIds };
  });
}

/** A materi that no course teaches yet — tenant-owned, no placement row. */
export async function seedMateri(
  t: T,
  fx: TenantFixture,
  opts: { slug: string; status?: "draft" | "published"; title?: string } = { slug: "materi" }
): Promise<Id<"lessons">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      slug: opts.slug,
      status: opts.status ?? "published",
      title: opts.title ?? "Materi mandiri",
      contentMd: "Materi mandiri",
      links: [],
    })
  );
}

/** Place an existing materi into a course (the reuse path). */
export async function placeLesson(
  t: T,
  fx: TenantFixture,
  courseId: Id<"courses">,
  lessonId: Id<"lessons">,
  order: number
): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId, lessonId, order });
  });
}
