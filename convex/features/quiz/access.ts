// quiz feature — access helpers. Every public function's handler calls one of
// these before touching data (P0 server-side authz; route guards are UX).
// Protected helpers authenticate (requireUser) BEFORE any DB read — the doc
// lookup only resolves the tenant for the role check, and anonymous callers
// are rejected before any domain row is touched (no existence oracle).
// Pattern: convex/features/courses/access.ts.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Quiz by id or NOT_FOUND. */
export async function getQuizOrFail(ctx: Ctx, quizId: Id<"quizzes">): Promise<Doc<"quizzes">> {
  const quiz = await ctx.db.get(quizId);
  if (quiz === null) fail("NOT_FOUND", "Kuis tidak ditemukan");
  return quiz;
}

/** Module by id or NOT_FOUND. (`mod` locally — `module` is CJS-reserved.) */
export async function getModuleOrFail(ctx: Ctx, moduleId: Id<"modules">): Promise<Doc<"modules">> {
  const mod = await ctx.db.get(moduleId);
  if (mod === null) fail("NOT_FOUND", "Modul tidak ditemukan");
  return mod;
}

/** Quiz attached to a module, or null (one quiz per module — see builder). */
export async function getQuizByModule(
  ctx: Ctx,
  moduleId: Id<"modules">
): Promise<Doc<"quizzes"> | null> {
  return await ctx.db
    .query("quizzes")
    .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
    .unique();
}

/**
 * Builder authz: resolve module → requireTenantRole(instructor) on the
 * module's own tenantId (every domain table carries tenantId). Course/tenant
 * for the new quiz are DERIVED from the module here — never trusted from the
 * client — so a crafted call can't smuggle a quiz into another tenant.
 */
export async function requireInstructorForModule(
  ctx: Ctx,
  moduleId: Id<"modules">
): Promise<{ userId: Id<"users">; module: Doc<"modules"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const mod = await getModuleOrFail(ctx, moduleId);
  const { userId } = await requireTenantRole(ctx, mod.tenantId, "instructor");
  return { userId, module: mod };
}

/** Builder authz keyed by an existing quiz (update/delete). */
export async function requireInstructorForQuiz(
  ctx: Ctx,
  quizId: Id<"quizzes">
): Promise<{ userId: Id<"users">; quiz: Doc<"quizzes"> }> {
  await requireUser(ctx); // auth BEFORE read
  const quiz = await getQuizOrFail(ctx, quizId);
  const { userId } = await requireTenantRole(ctx, quiz.tenantId, "instructor");
  return { userId, quiz };
}

/** Taking authz keyed by module (getQuizForTaking). */
export async function requireMemberForModule(
  ctx: Ctx,
  moduleId: Id<"modules">
): Promise<{ userId: Id<"users">; role: Doc<"memberships">["role"]; module: Doc<"modules"> }> {
  await requireUser(ctx); // auth BEFORE read
  const mod = await getModuleOrFail(ctx, moduleId);
  const { userId, membership } = await requireTenantRole(ctx, mod.tenantId, "member");
  return { userId, role: membership.role, module: mod };
}

/** Taking authz keyed by quiz (submitAttempt). */
export async function requireMemberForQuiz(
  ctx: Ctx,
  quizId: Id<"quizzes">
): Promise<{ userId: Id<"users">; role: Doc<"memberships">["role"]; quiz: Doc<"quizzes"> }> {
  await requireUser(ctx); // auth BEFORE read
  const quiz = await getQuizOrFail(ctx, quizId);
  const { userId, membership } = await requireTenantRole(ctx, quiz.tenantId, "member");
  return { userId, role: membership.role, quiz };
}

/**
 * Draft-course visibility gate (mirror courses/progress guard): a quiz on a
 * draft/archived course is invisible to plain members — they get NOT_FOUND,
 * no existence leak. instructor+ see it. Resolves the course by id.
 */
export async function requireVisibleCourse(
  ctx: Ctx,
  courseId: Id<"courses">,
  role: Doc<"memberships">["role"]
): Promise<Doc<"courses">> {
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  if (course.status !== "published" && role === "member") {
    fail("NOT_FOUND", "Kuis tidak ditemukan"); // draft invisible in the QUERY
  }
  return course;
}
