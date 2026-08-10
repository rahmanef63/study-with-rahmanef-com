// quiz feature — access helpers. Every public function's handler calls one of
// these before touching data (P0 server-side authz; route guards are UX).
// Protected helpers authenticate (requireUser) BEFORE any DB read — the doc
// lookup only resolves the tenant for the role check, and anonymous callers
// are rejected before any domain row is touched (no existence oracle).
// Pattern: convex/features/courses/access.ts.
//
// A quiz is owned by a COURSE (DECISIONS #37): membership resolves through the
// quiz's own tenantId and visibility through that course. There is nothing
// above the course to resolve — every helper here takes a courseId or a quizId.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;
type Role = Doc<"memberships">["role"];

/** Quiz by id or NOT_FOUND. */
export async function getQuizOrFail(ctx: Ctx, quizId: Id<"quizzes">): Promise<Doc<"quizzes">> {
  const quiz = await ctx.db.get(quizId);
  if (quiz === null) fail("NOT_FOUND", "Kuis tidak ditemukan");
  return quiz;
}

/** Course by id or NOT_FOUND. */
export async function getCourseOrFail(ctx: Ctx, courseId: Id<"courses">): Promise<Doc<"courses">> {
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  return course;
}

/**
 * Builder authz: resolve course → requireTenantRole(instructor) on the
 * COURSE's own tenantId (every domain table carries tenantId). tenantId for a
 * new quiz is DERIVED from the course here — never trusted from the client —
 * so a crafted call can't smuggle a quiz into another tenant.
 */
export async function requireInstructorForCourse(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; course: Doc<"courses"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const course = await getCourseOrFail(ctx, courseId);
  const { userId } = await requireTenantRole(ctx, course.tenantId, "instructor");
  return { userId, course };
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

/** Taking authz keyed by course (listQuizzesForCourse). */
export async function requireMemberForCourse(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; role: Role; course: Doc<"courses"> }> {
  await requireUser(ctx); // auth BEFORE read
  const course = await getCourseOrFail(ctx, courseId);
  const { userId, membership } = await requireTenantRole(ctx, course.tenantId, "member");
  return { userId, role: membership.role, course };
}

/** Taking authz keyed by quiz (getQuizForTaking, submitAttempt). */
export async function requireMemberForQuiz(
  ctx: Ctx,
  quizId: Id<"quizzes">
): Promise<{ userId: Id<"users">; role: Role; quiz: Doc<"quizzes"> }> {
  await requireUser(ctx); // auth BEFORE read
  const quiz = await getQuizOrFail(ctx, quizId);
  const { userId, membership } = await requireTenantRole(ctx, quiz.tenantId, "member");
  return { userId, role: membership.role, quiz };
}

/**
 * Draft-course visibility gate. A quiz belongs to its course (unlike a materi,
 * which is tenant-level now), so a quiz on a draft/archived course is invisible
 * to plain members — they get NOT_FOUND, no existence leak. instructor+ see it.
 */
export function assertCourseVisible(course: Doc<"courses">, role: Role): void {
  if (course.status !== "published" && role === "member") {
    fail("NOT_FOUND", "Kuis tidak ditemukan"); // draft invisible in the QUERY
  }
}

/** assertCourseVisible after resolving the course by id. */
export async function requireVisibleCourse(
  ctx: Ctx,
  courseId: Id<"courses">,
  role: Role
): Promise<Doc<"courses">> {
  const course = await getCourseOrFail(ctx, courseId);
  assertCourseVisible(course, role);
  return course;
}
