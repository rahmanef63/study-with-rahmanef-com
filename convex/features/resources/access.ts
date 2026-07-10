// resources feature — access helpers. Every public function's handler calls
// one of these before touching data (P0 server-side authz; route guards are
// UX). Protected write helpers authenticate (requireUser) BEFORE any by-ID
// read, so anonymous callers are rejected before a domain row is touched — no
// existence oracle (pattern: convex/features/courses/access.ts).
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Resource by id or NOT_FOUND. */
export async function getResourceOrFail(
  ctx: Ctx,
  resourceId: Id<"resources">
): Promise<Doc<"resources">> {
  const resource = await ctx.db.get(resourceId);
  if (resource === null) fail("NOT_FOUND", "Resource tidak ditemukan");
  return resource;
}

/** Suggestion by id or NOT_FOUND. */
export async function getSuggestionOrFail(
  ctx: Ctx,
  suggestionId: Id<"suggestions">
): Promise<Doc<"suggestions">> {
  const suggestion = await ctx.db.get(suggestionId);
  if (suggestion === null) fail("NOT_FOUND", "Usulan tidak ditemukan");
  return suggestion;
}

/**
 * Curation authz: auth FIRST, then resolve the doc and require instructor+ on
 * the doc's OWN tenantId (every domain table carries tenantId).
 */
export async function requireInstructorForResource(
  ctx: Ctx,
  resourceId: Id<"resources">
): Promise<{ userId: Id<"users">; resource: Doc<"resources"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const resource = await getResourceOrFail(ctx, resourceId);
  const { userId } = await requireTenantRole(ctx, resource.tenantId, "instructor");
  return { userId, resource };
}

export async function requireInstructorForSuggestion(
  ctx: Ctx,
  suggestionId: Id<"suggestions">
): Promise<{ userId: Id<"users">; suggestion: Doc<"suggestions"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const suggestion = await getSuggestionOrFail(ctx, suggestionId);
  const { userId } = await requireTenantRole(ctx, suggestion.tenantId, "instructor");
  return { userId, suggestion };
}

/**
 * Member-tier authz for vote actions (#18): auth FIRST, then resolve the
 * suggestion and require membership on the suggestion's OWN tenantId — the
 * tenant always comes from the row, never from client args.
 */
export async function requireMemberForSuggestion(
  ctx: Ctx,
  suggestionId: Id<"suggestions">
): Promise<{ userId: Id<"users">; suggestion: Doc<"suggestions"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const suggestion = await getSuggestionOrFail(ctx, suggestionId);
  const { userId } = await requireTenantRole(ctx, suggestion.tenantId, "member");
  return { userId, suggestion };
}

/**
 * Optional `courseId` on a resource must belong to the SAME tenant — prevents
 * cross-tenant linking. Reading the shared `courses` table directly is
 * sanctioned (table access ≠ code import; precedent: progress reads courses).
 */
export async function assertCourseInTenant(
  ctx: Ctx,
  courseId: Id<"courses">,
  tenantId: Id<"tenants">
): Promise<void> {
  const course = await ctx.db.get(courseId);
  if (course === null || course.tenantId !== tenantId) {
    fail("VALIDATION_FAILED", "Kelas terkait tidak valid untuk komunitas ini");
  }
}
