// tenants slice — tenant reads.
// P0 contract: v.* validators on every function; guarded first line of every
// handler. Public etalase reads (R2/R3) have no caller to authenticate — their
// guard is the status filter (only `active` tenants are visible, R6) plus the
// safe projection (never `discordWebhookUrl`, DATA-MODEL.md security note #1).
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import {
  TENANT_LIMITS,
  toManagedTenant,
  toPublicTenant,
  type PublicTenant,
} from "./helpers";

/**
 * Public community profile by slug (`/t/[slug]` etalase).
 * Returns `null` when the slug is unknown OR the tenant is not active —
 * pending/suspended tenants are indistinguishable from missing ones (R6).
 */
export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Guard: active-only + safe projection (public by design, see header).
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (tenant === null || tenant.status !== "active") return null;
    return toPublicTenant(tenant);
  },
});

/**
 * Active communities for the landing etalase (R2). Public by design; safe
 * projection; bounded via by_status index + take (no bare .collect()).
 */
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Guard: active-only + safe projection (public by design, see header).
    const limit = Math.min(
      Math.max(1, Math.floor(args.limit ?? TENANT_LIMITS.activeListMax)),
      TENANT_LIMITS.activeListMax
    );
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(limit);
    return tenants.map(toPublicTenant);
  },
});

/**
 * Communities the signed-in user belongs to ("Komunitas saya", UI-UX-PRD §5.3).
 * Auth FIRST (requireUser) — never leaks membership to anon. Bounded by the
 * by_user membership index; returns the public tenant projection + the caller's
 * own role. Active-only, matching R6 (pending/suspended stay invisible).
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(TENANT_LIMITS.activeListMax);
    const out: (PublicTenant & { role: "owner" | "instructor" | "member" })[] = [];
    for (const m of memberships) {
      const tenant = await ctx.db.get(m.tenantId);
      if (tenant === null || tenant.status !== "active") continue;
      out.push({ ...toPublicTenant(tenant), role: m.role });
    }
    return out;
  },
});

/**
 * Owner-only manage view for the tenant settings form (R3 kelola).
 * Reveals `status` and WHETHER a Discord webhook is configured — never the
 * webhook URL itself (write-only secret).
 */
export const getManageView = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "owner");
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null) return null; // deleted between authz and read — treat as gone
    return toManagedTenant(tenant);
  },
});
