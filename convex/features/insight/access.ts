// insight feature — authz helpers. Every public function's handler calls one of
// these as its FIRST LINE (P0 server-side authz; route guards are UX only).
// Auth runs BEFORE any domain read so an anonymous caller is rejected before a
// row is touched — otherwise a dangling id would answer NOT_FOUND and turn the
// endpoint into an existence oracle. Mirrors features/analytics/access.ts.
//
// Two gates, deliberately different:
//  · recordView is MEMBER-only — the write surface. Membership is the rate
//    limit, so this check is the anti-spam mechanism, not just an ACL.
//  · courseFunnel / tenantPulse are INSTRUCTOR+ — DATA-MODEL "Aturan akses per
//    tabel": "lessonCompletions | user sendiri; agregat: instructor+".
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireActiveTenantById, requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Materi + membership(member) on the materi's own tenant, or throw. */
export async function requireMemberForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons">; membership: Doc<"memberships"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  return { userId, lesson, membership };
}

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
 * needed: requireTenantRole authenticates first, then checks the caller's OWN
 * membership row via by_tenant_user — nothing about the tenant leaks either way.
 */
export async function requireInstructorForTenant(
  ctx: Ctx,
  tenantId: Id<"tenants">
): Promise<{ userId: Id<"users"> }> {
  const { userId } = await requireTenantRole(ctx, tenantId, "instructor");
  return { userId };
}

/**
 * MATERI VISIBILITY — the same single gate features/progress/access.ts applies:
 * a plain member sees a materi when `status` is "published", and `undefined`
 * COUNTS AS published (the 76 pre-migration rows predate the column).
 * instructor+ additionally sees drafts. The owning course's draft status is
 * irrelevant — materi is tenant-level content (DECISIONS #36/#37).
 *
 * Throws NOT_FOUND rather than NOT_AUTHORIZED: a member must not learn that an
 * unpublished materi exists.
 */
export function assertLessonVisibleByRole(
  lesson: Doc<"lessons">,
  role: Doc<"memberships">["role"]
): void {
  if ((lesson.status ?? "published") !== "published" && role === "member") {
    fail("NOT_FOUND", "Materi tidak ditemukan");
  }
}

/**
 * An OPTIONAL tenant reference supplied by the caller (learnerProfiles.tenantId
 * is provenance, "which community they were looking at"). Membership is NOT
 * required — the assessment is for people who have not joined anything yet,
 * which is the entire problem it solves — but the tenant must EXIST and be
 * ACTIVE, so a junk or suspended id cannot be parked on the row.
 */
export async function resolveOptionalTenant(
  ctx: Ctx,
  tenantId: Id<"tenants"> | undefined
): Promise<Id<"tenants"> | undefined> {
  if (tenantId === undefined) return undefined;
  const tenant = await requireActiveTenantById(ctx, tenantId);
  return tenant._id;
}
