// analytics feature — authz helpers. Every public query's handler calls one of
// these FIRST (P0 server-side authz; route guards are UX only). Auth runs
// BEFORE any domain read so anonymous callers are rejected before a row is
// touched (no existence oracle) — mirrors convex/features/progress/access.ts.
//
// Analytics is instructor+ ONLY (docs/DATA-MODEL.md access table:
// "lessonCompletions … agregat: instructor+"). A plain member calling any
// analytics function gets NOT_AUTHORIZED — asserted in the specs (P0).
import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

/** Course + membership(instructor+) on the course's own tenant, or throw. */
export async function requireInstructorForCourse(
  ctx: QueryCtx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; course: Doc<"courses"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  const { userId } = await requireTenantRole(ctx, course.tenantId, "instructor");
  return { userId, course };
}

/**
 * Membership(instructor+) on `tenantId`, or throw. No prior domain read is
 * needed: requireTenantRole authenticates first, then checks the caller's own
 * membership row via by_tenant_user — nothing about the tenant leaks.
 */
export async function requireInstructorForTenant(
  ctx: QueryCtx,
  tenantId: Id<"tenants">
): Promise<{ userId: Id<"users"> }> {
  const { userId } = await requireTenantRole(ctx, tenantId, "instructor");
  return { userId };
}
