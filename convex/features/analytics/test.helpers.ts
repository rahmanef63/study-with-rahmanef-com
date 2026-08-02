/// <reference types="vite/client" />
// Shared fixture for analytics convex-test specs (pattern: courses/
// test.helpers.ts). Roles covered: owner / instructor / member / outsider —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
// Self-contained inside the analytics feature — no cross-slice test imports.
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
export async function seedTenantFixture(t: T, slug = "komunitas-test"): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec analytics",
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

/** Course + 1 module + N lessons in the given status. N = 0 seeds no lessons. */
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
          contentMd: `# Materi ${i + 1}`,
          links: [],
          order: i + 1,
        })
      );
    }
    return { courseId, moduleId, lessonIds };
  });
}

/** Direct lessonCompletions insert — exercises reads independent of mutations. */
export async function insertCompletion(
  t: T,
  fx: TenantFixture,
  c: CourseFixture,
  userId: Id<"users">,
  lessonId: Id<"lessons">
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId,
      userId,
      courseId: c.courseId,
      lessonId,
    });
  });
}

/** Direct courseCompletions (badge) insert. */
export async function insertBadge(t: T, fx: TenantFixture, courseId: Id<"courses">, userId: Id<"users">) {
  await t.run(async (ctx) => {
    await ctx.db.insert("courseCompletions", { tenantId: fx.tenantId, userId, courseId });
  });
}

/** One-question quiz on the fixture module. */
export async function seedQuiz(t: T, fx: TenantFixture, c: CourseFixture): Promise<Id<"quizzes">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("quizzes", {
      tenantId: fx.tenantId,
      courseId: c.courseId,
      moduleId: c.moduleId,
      title: "Kuis Modul 1",
      passingScorePct: 50,
      questions: [
        { prompt: "Apa itu AI?", options: ["Kecerdasan buatan", "Kucing"], correctIndex: 0 },
      ],
    });
  });
}

/** Direct quizAttempts insert with an explicit passed flag. */
export async function insertAttempt(
  t: T,
  fx: TenantFixture,
  quizId: Id<"quizzes">,
  userId: Id<"users">,
  passed: boolean
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("quizAttempts", {
      tenantId: fx.tenantId,
      userId,
      quizId,
      answers: [0],
      scorePct: passed ? 100 : 0,
      passed,
    });
  });
}
