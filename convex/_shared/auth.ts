// Shared authz helpers — the FIRST LINE of every public function handler calls
// one of these (P0, docs/rr-conventions.md "server-side authz"). Route/layout
// guards are UX only; this file is the security boundary.
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export type TenantRole = "member" | "instructor" | "owner";

const ROLE_RANK: Record<TenantRole, number> = { member: 0, instructor: 1, owner: 2 };

/** Authenticated user or throw NOT_AUTHENTICATED. */
export async function requireUser(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Silakan login dulu" });
  }
  return userId;
}

/**
 * Membership with at least `min` role in `tenantId`, or throw.
 * Hierarchy: member < instructor < owner (owner passes every check).
 */
export async function requireTenantRole(
  ctx: Ctx,
  tenantId: Id<"tenants">,
  min: TenantRole
): Promise<{ userId: Id<"users">; membership: Doc<"memberships"> }> {
  const userId = await requireUser(ctx);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", userId))
    .unique();
  if (membership === null || ROLE_RANK[membership.role] < ROLE_RANK[min]) {
    throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Kamu tidak punya akses untuk aksi ini" });
  }
  return { userId, membership };
}

/** Platform admin (profiles.isPlatformAdmin) or throw. */
export async function requirePlatformAdmin(
  ctx: Ctx
): Promise<{ userId: Id<"users">; profile: Doc<"profiles"> }> {
  const userId = await requireUser(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (profile === null || profile.isPlatformAdmin !== true) {
    throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Butuh akses platform admin" });
  }
  return { userId, profile };
}

/** Active tenant by slug or throw NOT_FOUND (suspended/pending excluded). */
export async function requireActiveTenantBySlug(
  ctx: Ctx,
  slug: string
): Promise<Doc<"tenants">> {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (tenant === null || tenant.status !== "active") {
    throw new ConvexError({ code: "NOT_FOUND", message: "Komunitas tidak ditemukan" });
  }
  return tenant;
}
