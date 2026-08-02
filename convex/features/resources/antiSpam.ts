// resources feature — light anti-spam guard (docs/DATA-MODEL.md "Catatan
// keamanan #4"): a user may hold at most MAX_PENDING_PER_USER items awaiting
// review per tenant. This is the DATA-MODEL's deliberate simple guard — NOT the
// rr `rate-limit` dependency (docs/AGENT-PROMPTS.md epsilon: do not install it).
//
// Counted via the by_tenant_status index (jump straight to the active-status
// segment) with a bounded .take() then filter by submittedBy — never a bare
// .collect(). The scan is bounded, so this is an approximate cap by design
// (a tenant queue beyond the bound is not fully counted); acceptable for a
// "ringan" anti-spam whose only job is stopping runaway submitters.
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { fail } from "./errors";

export const MAX_PENDING_PER_USER = 5;

// Bounds the index scan; MAX_PENDING_PER_USER ≪ this, so a normal queue is
// counted exactly. // TODO(rr): bounded table — light anti-spam per DATA-MODEL #4.
export const ANTISPAM_SCAN_TAKE = 200;

/** Count a user's PENDING resources in a tenant (by_tenant_status → pending). */
export async function countUserPendingResources(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  userId: Id<"users">
): Promise<number> {
  const rows = await ctx.db
    .query("resources")
    .withIndex("by_tenant_status", (q) =>
      q.eq("tenantId", tenantId).eq("status", "pending")
    )
    .take(ANTISPAM_SCAN_TAKE);
  return rows.reduce((n, r) => (r.submittedBy === userId ? n + 1 : n), 0);
}

/** Count a user's OPEN suggestions in a tenant (by_tenant_status → open). */
export async function countUserOpenSuggestions(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  userId: Id<"users">
): Promise<number> {
  const rows = await ctx.db
    .query("suggestions")
    .withIndex("by_tenant_status", (q) =>
      q.eq("tenantId", tenantId).eq("status", "open")
    )
    .take(ANTISPAM_SCAN_TAKE);
  return rows.reduce((n, r) => (r.submittedBy === userId ? n + 1 : n), 0);
}

/** Reject the submit when the caller is already at/over the pending cap. */
export function assertUnderLimit(currentCount: number): void {
  if (currentCount >= MAX_PENDING_PER_USER) {
    fail(
      "RATE_LIMITED",
      `Maksimal ${MAX_PENDING_PER_USER} kiriman menunggu peninjauan per komunitas — tunggu peninjauan dulu`
    );
  }
}
