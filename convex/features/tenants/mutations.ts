// tenants slice — writes: join flow, owner profile edit, role management.
// P0: v.* validators + authz helper first line; ConvexError({ code, message })
// only; `discordWebhookUrl` is write-only (accepted here, never echoed back).
import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { buildProfilePatch, toManagedTenant } from "./helpers";

/**
 * Join an active tenant as `member` (R3). Idempotent: an existing membership
 * (any role) is returned untouched — joining twice never demotes an owner.
 */
export const join = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null || tenant.status !== "active") {
      throw new ConvexError({ code: "NOT_FOUND", message: "Komunitas tidak ditemukan" });
    }
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", userId)
      )
      .unique();
    if (existing !== null) {
      return { joined: false as const, role: existing.role };
    }
    await ctx.db.insert("memberships", {
      tenantId: args.tenantId,
      userId,
      role: "member",
    });
    return { joined: true as const, role: "member" as const };
  },
});

/**
 * Owner edits the tenant profile (name, description, track, Discord links).
 * Field semantics: omitted = unchanged; "" = clear (optional fields only).
 * Returns the managed shape — the webhook URL itself is never returned.
 */
export const updateProfile = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    track: v.optional(v.string()),
    discordInviteUrl: v.optional(v.string()),
    discordWebhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "owner");
    const { tenantId, ...input } = args;
    const { errors, patch } = buildProfilePatch(input);
    if (errors.length > 0) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        message: `Input tidak valid: ${errors.join(", ")}`,
      });
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(tenantId, patch);
    }
    const tenant = await ctx.db.get(tenantId);
    if (tenant === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Komunitas tidak ditemukan" });
    }
    return toManagedTenant(tenant);
  },
});

/**
 * Owner promotes/demotes between `member` and `instructor` (role data layer;
 * management UI ships with R13). `owner` is never assignable here and an
 * owner row can never be changed — ownership transfer is out of scope.
 */
export const setMemberRole = mutation({
  args: {
    tenantId: v.id("tenants"),
    targetUserId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("instructor")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "owner");
    if (args.targetUserId === userId) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        message: "Kamu tidak bisa mengubah role milikmu sendiri",
      });
    }
    const target = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", args.tenantId).eq("userId", args.targetUserId)
      )
      .unique();
    if (target === null) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Anggota tidak ditemukan" });
    }
    if (target.role === "owner") {
      throw new ConvexError({
        code: "NOT_AUTHORIZED",
        message: "Role owner tidak bisa diubah dari sini",
      });
    }
    if (target.role !== args.role) {
      await ctx.db.patch(target._id, { role: args.role });
    }
    return { userId: args.targetUserId, role: args.role };
  },
});
