// tenants slice — platform-admin approval queue (#6, v1.1). Every handler is
// platform-admin gated: requirePlatformAdmin == requireUser + isPlatformAdmin,
// so authentication runs BEFORE any tenant read (no existence oracle for
// anonymous callers, matching convex/features/courses/access.ts). P0: v.*
// validators; ConvexError({ code, message }) only; the pending projection
// never exposes discordWebhookUrl.
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { requirePlatformAdmin, requireUser } from "../../_shared/auth";
import { TENANT_REQUEST_LIMITS, toPendingRequest } from "./request-helpers";

/**
 * Pending community requests for the admin queue. Bounded read via by_status
 * index + take; each row projected to the admin-safe shape (never the webhook).
 */
export const listPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limit = Math.min(
      Math.max(1, Math.floor(args.limit ?? TENANT_REQUEST_LIMITS.listPendingMax)),
      TENANT_REQUEST_LIMITS.listPendingMax
    );
    const pending = await ctx.db
      .query("tenants")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);
    return Promise.all(
      pending.map(async (tenant) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", tenant.ownerId))
          .unique();
        return toPendingRequest(tenant, profile);
      })
    );
  },
});

/**
 * Approve a pending request (R7): status → "active" and ensure the requester
 * holds an `owner` membership. Idempotent — re-approving an already-active
 * tenant is a no-op that still guarantees the owner membership exists.
 *
 * The requester becomes owner of THIS tenant only; no membership is created in
 * any other tenant, so an approved owner is never an auto-instructor elsewhere.
 */
export const approve = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx); // auth BEFORE the tenant read
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Komunitas tidak ditemukan" });
    }
    if (tenant.status !== "active") {
      await ctx.db.patch(args.tenantId, { status: "active" });
    }
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", tenant.ownerId)
      )
      .unique();
    if (existing === null) {
      await ctx.db.insert("memberships", {
        tenantId: args.tenantId,
        userId: tenant.ownerId,
        role: "owner",
      });
    } else if (existing.role !== "owner") {
      await ctx.db.patch(existing._id, { role: "owner" });
    }
    return { slug: tenant.slug, status: "active" as const };
  },
});

/**
 * Reject a pending request (R7). SEMANTIC NOTE: tenants.status has no "rejected"
 * literal in the SSOT schema (docs/DATA-MODEL.md), so a rejection is modelled as
 * "suspended". `requestMessage` is left intact so the decision keeps its
 * context for later review. Idempotent.
 */
export const reject = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx); // auth BEFORE the tenant read
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Komunitas tidak ditemukan" });
    }
    if (tenant.status !== "suspended") {
      await ctx.db.patch(args.tenantId, { status: "suspended" });
    }
    return { slug: tenant.slug, status: "suspended" as const };
  },
});

/**
 * UX probe: is the caller a platform admin? Drives the admin-queue client gate
 * only — the real security boundary is requirePlatformAdmin on the functions
 * above. requireUser first keeps it P0-compliant; the client skips until authed.
 */
export const getMyPlatformAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return { isPlatformAdmin: profile?.isPlatformAdmin === true };
  },
});
