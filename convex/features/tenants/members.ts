// tenants slice — membership reads (role data layer, R3).
// P0: v.* validators + authz helper first line of every handler.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { TENANT_LIMITS } from "./helpers";

/**
 * The caller's own membership in a tenant, or `null` when not a member.
 * Drives the join-button state; unauthenticated callers are rejected —
 * the client passes "skip" until auth is ready.
 */
export const getMyMembership = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", userId)
      )
      .unique();
    if (membership === null) return null;
    return { role: membership.role, since: membership._creationTime };
  },
});

/**
 * Member roster with display info (access rule: readable by members of the
 * tenant). Bounded read via by_tenant index + take.
 */
export const listMembers = query({
  args: { tenantId: v.id("tenants"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "member");
    const limit = Math.min(
      Math.max(1, Math.floor(args.limit ?? TENANT_LIMITS.membersPageDefault)),
      TENANT_LIMITS.membersPageMax
    );
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .take(limit);

    return Promise.all(
      memberships.map(async (m) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", m.userId))
          .unique();
        return {
          userId: m.userId,
          role: m.role,
          since: m._creationTime,
          // Profile may not exist yet (ensure-on-first-login is slice #4).
          username: profile?.username,
          displayName: profile?.displayName,
          avatarUrl: profile?.avatarUrl,
        };
      })
    );
  },
});
