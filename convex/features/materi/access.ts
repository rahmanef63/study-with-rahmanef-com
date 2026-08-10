// materi feature — access helpers. Every public function's handler calls one of
// these as its FIRST line (P0 server-side authz; route guards are UX only).
// Protected helpers authenticate BEFORE any by-id read, so an anonymous caller
// can never use a 404-vs-403 difference as an existence oracle.
//
// ── THE MATERI VISIBILITY CONTRACT (DECISIONS #36/#37) ────────────────────────
// A materi is TENANT-level content, not course-level content. Therefore:
//   1. a MEMBER of the materi's tenant sees it when its status is "published" —
//      and `status === undefined` COUNTS AS PUBLISHED, because 76 production
//      rows predate the column and drafts were a course-level concept then;
//   2. instructor+ additionally sees drafts;
//   3. a COURSE's draft status gates the COURSE PAGE only. It never hides the
//      materi — that separation is the entire point of the model. What the
//      course's status does gate is whether that course is *named* in the
//      "muncul di kelas" list below instructor level;
//   4. an ANONYMOUS caller gets the etalase — title, tags, which published
//      courses teach it — and NEVER the body.
// Every clause above is asserted in queries.test.ts / library.test.ts.
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import {
  requireActiveTenantBySlug,
  requireTenantRole,
  requireUser,
  type TenantRole,
} from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/**
 * Non-throwing role probe, for reads that are legal for everyone but must widen
 * for instructor+.
 * TODO(rr): confirm — local duplicate of the same helper in features/courses;
 * convex/_shared/** is integrator-only and ships throwing helpers only. Propose
 * promoting a shared `getViewerRole` post-v1.
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

/**
 * Clause 1 of the contract. Deliberately NOT imported from the shared
 * legacy-column accessor module in `_shared/`: that module is the migration
 * work list (the integrator greps for its name, and the grep has to keep
 * shrinking), so a NEW reader must not be added to it. The `?? "published"`
 * default is the materi model's own rule, not a legacy-tree accessor — it
 * outlives the migration.
 */
export function isPublishedMateri(lesson: Doc<"lessons">): boolean {
  return (lesson.status ?? "published") === "published";
}

/**
 * `lessons.kind` with its documented default. A row without the column is a
 * MATERI — the 76 pre-migration rows predate it, and treating the absence as
 * anything else would drop the whole existing library out of its own tab.
 * Sibling of `isPublishedMateri`: both encode "undefined means the old default".
 */
export function materiKind(lesson: Doc<"lessons">): "materi" | "skill" {
  return lesson.kind ?? "materi";
}

/** Clauses 1+2: can this viewer see this materi at all? */
export function canSeeMateri(lesson: Doc<"lessons">, role: TenantRole | null): boolean {
  if (role === null) return false; // anonymous: etalase only, never this path
  return isPublishedMateri(lesson) || isInstructorPlus(role);
}

/** Member+ of the tenant named by `tenantSlug`. Auth runs before the tenant read. */
export async function requireMemberForTenantSlug(
  ctx: Ctx,
  tenantSlug: string
): Promise<{ userId: Id<"users">; tenant: Doc<"tenants">; role: TenantRole }> {
  await requireUser(ctx); // auth BEFORE any domain read
  const tenant = await requireActiveTenantBySlug(ctx, tenantSlug);
  const { userId, membership } = await requireTenantRole(ctx, tenant._id, "member");
  return { userId, tenant, role: membership.role };
}

/**
 * Member+ of the materi's OWN tenant, with the visibility contract applied:
 * a draft reads as NOT_FOUND for a plain member (no existence leak).
 */
export async function requireMemberForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons">; role: TenantRole }> {
  await requireUser(ctx); // auth BEFORE read
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  if (!canSeeMateri(lesson, membership.role)) {
    fail("NOT_FOUND", "Materi tidak ditemukan"); // draft invisible to members
  }
  return { userId, lesson, role: membership.role };
}

/**
 * Write authz for materi metadata: the AUTHOR of the materi, or any
 * instructor+ of its tenant. A member who did not write it gets NOT_AUTHORIZED;
 * an outsider is rejected by the membership check before authorship is read.
 */
export async function requireAuthorOrInstructor(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons">; role: TenantRole }> {
  await requireUser(ctx); // auth BEFORE read
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  if (!isInstructorPlus(membership.role) && lesson.authorId !== userId) {
    fail("NOT_AUTHORIZED", "Hanya penulis materi atau pengajar yang bisa mengubah ini");
  }
  return { userId, lesson, role: membership.role };
}
