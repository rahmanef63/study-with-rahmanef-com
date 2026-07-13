/// <reference types="vite/client" />
// Shared fixture for search convex-test specs (pattern: convex/seed.test.ts +
// courses/test.helpers.ts — duplicated per feature because cross-feature deep
// imports are off-limits; only _shared is common ground).
// Roles covered: owner / instructor / member / outsider (no membership).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Absolute glob keeps every key rooted at /convex so convex-test can resolve
// nested function paths consistently from this nested helper.
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
export async function seedTenantFixture(
  t: T,
  slug = "komunitas-test"
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: `Komunitas ${slug}`,
      description: "Tenant fixture untuk spec search",
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

export type SeedCourseOpts = {
  status: "draft" | "published" | "archived";
  slug: string;
  title: string;
  lessonTitle?: string;
  contentMd?: string;
};

/** Course + 1 module + 1 lesson with controllable searchable text. */
export async function seedCourseWithLesson(
  t: T,
  fx: TenantFixture,
  opts: SeedCourseOpts
): Promise<CourseFixture> {
  return await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: opts.slug,
      title: opts.title,
      description: "Deskripsi kelas fixture",
      status: opts.status,
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
      title: opts.lessonTitle ?? "Lesson 1",
      contentMd: opts.contentMd ?? "Materi pertama.",
      links: [],
      order: 1,
    });
    return { courseId, moduleId, lessonId };
  });
}
