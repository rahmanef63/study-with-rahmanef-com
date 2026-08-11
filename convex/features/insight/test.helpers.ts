/// <reference types="vite/client" />
// Shared fixture for insight convex-test specs (pattern: analytics/
// test.helpers.ts). Roles covered: owner / instructor / member / outsider —
// every public function is exercised on its authz-DENIED path with these
// (AGENTS.md §5.2, P0). Self-contained inside the insight feature: no
// cross-slice test imports.
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
  member2Id: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(t: T, slug = "komunitas-test"): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const member2Id = await ctx.db.insert("users", { email: `member2@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec insight",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    await ctx.db.insert("memberships", { tenantId, userId: member2Id, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, member2Id, outsiderId };
  });
}

export type CourseFixture = { courseId: Id<"courses">; lessonIds: Id<"lessons">[] };

/** Course + N published materi PLACED in it via `courseLessons` (order 1..N). */
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
        title: `Materi ${i + 1}`,
        contentMd: `# Materi ${i + 1}`,
        links: [],
      });
      await ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId, lessonId, order: i + 1 });
      lessonIds.push(lessonId);
    }
    return { courseId, lessonIds };
  });
}

/** A standalone materi with an explicit status (or none at all). */
export async function seedLesson(
  t: T,
  fx: TenantFixture,
  slug: string,
  status?: "draft" | "published"
): Promise<Id<"lessons">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      slug,
      status,
      title: `Materi ${slug}`,
      contentMd: "Isi materi",
      links: [],
    });
  });
}

/** Direct lessonCompletions insert (courseId = PROVENANCE only). */
export async function insertCompletion(
  t: T,
  fx: TenantFixture,
  userId: Id<"users">,
  lessonId: Id<"lessons">,
  courseId?: Id<"courses">
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", { tenantId: fx.tenantId, userId, courseId, lessonId });
  });
}

/**
 * Raw materiViews row for a given day, WITHOUT touching the roll-up. Used by
 * the specs that read history directly (active-learners window); anything
 * asserting on the roll-up must go through the recordView mutation instead, so
 * the two can never be asserted out of sync.
 */
export async function insertRawView(
  t: T,
  fx: TenantFixture,
  lessonId: Id<"lessons">,
  userId: Id<"users">,
  day: string
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("materiViews", { tenantId: fx.tenantId, lessonId, userId, day });
  });
}

/** The stored roll-up for one materi, or null when nobody has opened it. */
export async function readTally(t: T, fx: TenantFixture, lessonId: Id<"lessons">) {
  return await t.run(async (ctx) => {
    return await ctx.db
      .query("materiViewCounts")
      .withIndex("by_tenant_lesson", (q) =>
        q.eq("tenantId", fx.tenantId).eq("lessonId", lessonId)
      )
      .unique();
  });
}

/** How many materiViews rows exist for one materi (history, not roll-up). */
export async function countViewRows(t: T, lessonId: Id<"lessons">): Promise<number> {
  return await t.run(async (ctx) => {
    const rows = await ctx.db
      .query("materiViews")
      .withIndex("by_lesson_user_day", (q) => q.eq("lessonId", lessonId))
      .take(100);
    return rows.length;
  });
}
