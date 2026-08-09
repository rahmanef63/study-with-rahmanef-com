// events feature — access helper. Every write handler calls this before it
// touches data (P0 server-side authz; route guards are UX only).
//
// ORDER MATTERS: requireUser runs BEFORE the by-id read, so an anonymous caller
// gets NOT_AUTHENTICATED whether or not the id exists — a read-first handler
// would answer NOT_FOUND vs NOT_AUTHORIZED and become an existence oracle
// (pattern: convex/features/comments/access.ts, regression-tested with a
// dangling id in mutations.test.ts).
//
// The role is checked against the EVENT's own tenantId, never a tenantId from
// args — otherwise an instructor of tenant A could edit tenant B's calendar.
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Instructor+ on the event's tenant, or throw. Returns the resolved row. */
export async function requireInstructorForEvent(
  ctx: Ctx,
  eventId: Id<"events">
): Promise<{ userId: Id<"users">; event: Doc<"events"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const event = await ctx.db.get(eventId);
  if (event === null) fail("NOT_FOUND", "Acara tidak ditemukan");
  const { userId } = await requireTenantRole(ctx, event.tenantId, "instructor");
  return { userId, event };
}
