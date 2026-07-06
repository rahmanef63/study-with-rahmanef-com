/// <reference types="vite/client" />
// Shared fixture for quiz convex-test specs (pattern: courses/test.helpers.ts).
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
// Self-contained inside the quiz slice — no cross-slice test imports.
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
export async function seedTenantFixture(t: T): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec quiz",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type CourseModuleFixture = {
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
};

/** Course + one module in the given status, owned by the fixture instructor. */
export async function seedCourseModule(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived",
  slug = `kelas-${status}`
): Promise<CourseModuleFixture> {
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
    return { courseId, moduleId };
  });
}

/** Two-question quiz (passingScorePct default 50) directly on `moduleId`. */
export async function seedQuiz(
  t: T,
  fx: TenantFixture,
  cm: CourseModuleFixture,
  passingScorePct = 50
): Promise<Id<"quizzes">> {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("quizzes", {
      tenantId: fx.tenantId,
      courseId: cm.courseId,
      moduleId: cm.moduleId,
      title: "Kuis Modul 1",
      passingScorePct,
      questions: [
        {
          prompt: "Apa itu AI?",
          options: ["Kecerdasan buatan", "Kucing", "Mobil"],
          correctIndex: 0,
          explanation: "AI = Artificial Intelligence.",
        },
        {
          prompt: "2 + 2 = ?",
          options: ["3", "4", "5"],
          correctIndex: 1,
          explanation: "Dua tambah dua sama dengan empat.",
        },
      ],
    });
  });
}

/** Valid createQuiz payload for a module (instructor-authored). */
export function validQuizArgs(moduleId: Id<"modules">) {
  return {
    moduleId,
    title: "Kuis Pengantar AI",
    passingScorePct: 50,
    questions: [
      {
        prompt: "Apa kepanjangan AI?",
        options: ["Artificial Intelligence", "Auto Increment"],
        correctIndex: 0,
        explanation: "Artificial Intelligence.",
      },
      {
        prompt: "Bahasa populer untuk ML?",
        options: ["Python", "COBOL", "Pascal"],
        correctIndex: 0,
      },
    ],
  };
}
