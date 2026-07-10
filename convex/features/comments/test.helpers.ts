/// <reference types="vite/client" />
// Shared fixture for comments convex-test specs (pattern:
// convex/features/courses/test.helpers.ts — duplicated per feature because
// cross-feature imports have no barrel; convex/_shared is integrator-only).
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
import { convexTest } from "convex-test";
import type { Doc, Id } from "../../_generated/dataModel";
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
export async function seedTenantFixture(t: T, slug = "komunitas-test"): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec comments",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type LessonFixture = {
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  lessonId: Id<"lessons">;
};

/** Course (given status) + 1 module + 1 lesson, owned by the fixture instructor. */
export async function seedLesson(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived" = "published",
  slug = `kelas-${status}`
): Promise<LessonFixture> {
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
      links: [],
      order: 1,
    });
    return { courseId, moduleId, lessonId };
  });
}

/** Direct-insert a comment row (bypasses the mutation — fixture only). */
export async function seedComment(
  t: T,
  fx: TenantFixture,
  lessonId: Id<"lessons">,
  userId: Id<"users">,
  bodyMd: string,
  extra: Partial<Pick<Doc<"comments">, "parentId" | "deletedAt">> = {}
): Promise<Id<"comments">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("comments", {
      tenantId: fx.tenantId,
      lessonId,
      userId,
      bodyMd,
      ...extra,
    })
  );
}

/** Profile row so the author join resolves a display name. */
export async function seedProfile(
  t: T,
  userId: Id<"users">,
  username: string,
  displayName: string
): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("profiles", { userId, username, displayName });
  });
}
