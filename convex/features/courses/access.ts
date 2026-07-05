// courses feature — access helpers. Every public function's handler calls one
// of these before touching data (P0 server-side authz; route guards are UX).
// Doc-first lookups here only RESOLVE the tenant for the authz check — nothing
// is returned to the caller before the role check passes.
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, type TenantRole } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/**
 * Non-throwing role probe for PUBLIC etalase queries (course title/syllabus
 * are public per docs/DATA-MODEL.md access table) that must still hide drafts
 * from everyone below instructor. Returns null for anonymous callers and
 * non-members.
 * TODO(rr): confirm — local duplicate of _shared membership lookup because
 * convex/_shared/** is integrator-only and only ships throwing helpers;
 * propose promoting a shared `getViewerRole` post-v1.
 */
export async function getViewerRole(
  ctx: Ctx,
  tenantId: Id<"tenants">
): Promise<TenantRole | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", userId))
    .unique();
  return membership?.role ?? null;
}

export function isInstructorPlus(role: TenantRole | null): boolean {
  return role === "instructor" || role === "owner";
}

/** Course by id or NOT_FOUND. */
export async function getCourseOrFail(ctx: Ctx, courseId: Id<"courses">): Promise<Doc<"courses">> {
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  return course;
}

/** Module by id or NOT_FOUND. (`mod` locally — `module` is CJS-reserved.) */
export async function getModuleOrFail(ctx: Ctx, moduleId: Id<"modules">): Promise<Doc<"modules">> {
  const mod = await ctx.db.get(moduleId);
  if (mod === null) fail("NOT_FOUND", "Modul tidak ditemukan");
  return mod;
}

/** Lesson by id or NOT_FOUND. */
export async function getLessonOrFail(ctx: Ctx, lessonId: Id<"lessons">): Promise<Doc<"lessons">> {
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Lesson tidak ditemukan");
  return lesson;
}

/**
 * Authz for course-scoped writes: resolve doc → requireTenantRole(instructor)
 * on the doc's own tenantId (every domain table carries tenantId).
 */
export async function requireInstructorForCourse(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; course: Doc<"courses"> }> {
  const course = await getCourseOrFail(ctx, courseId);
  const { userId } = await requireTenantRole(ctx, course.tenantId, "instructor");
  return { userId, course };
}

export async function requireInstructorForModule(
  ctx: Ctx,
  moduleId: Id<"modules">
): Promise<{ userId: Id<"users">; module: Doc<"modules"> }> {
  const mod = await getModuleOrFail(ctx, moduleId);
  const { userId } = await requireTenantRole(ctx, mod.tenantId, "instructor");
  return { userId, module: mod };
}

export async function requireInstructorForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons"> }> {
  const lesson = await getLessonOrFail(ctx, lessonId);
  const { userId } = await requireTenantRole(ctx, lesson.tenantId, "instructor");
  return { userId, lesson };
}
