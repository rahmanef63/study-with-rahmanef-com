// One-shot bootstrap for the first tenant (STATUS.md #0 "seed first tenant").
// Internal-only: not callable from clients. Run AFTER the owner has logged in
// once with Google, from the CLI:
//
//   npx convex run seed:bootstrap '{
//     "ownerEmail": "rahmanef63@gmail.com",
//     "username": "rahman",
//     "displayName": "Rahman",
//     "tenantSlug": "belajar-ai",
//     "tenantName": "Belajar AI bareng Rahman",
//     "tenantDescription": "Komunitas belajar pengaplikasian AI untuk semua orang."
//   }'
//
// Idempotent: safe to re-run; existing rows are kept.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const bootstrap = internalMutation({
  args: {
    ownerEmail: v.string(),
    username: v.string(),
    displayName: v.string(),
    tenantSlug: v.string(),
    tenantName: v.string(),
    tenantDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.ownerEmail))
      .unique();
    if (user === null) {
      throw new Error(
        `No user with email ${args.ownerEmail} — log in once with Google first, then re-run.`
      );
    }

    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (profile === null) {
      const profileId = await ctx.db.insert("profiles", {
        userId: user._id,
        username: args.username,
        displayName: args.displayName,
        isPlatformAdmin: true,
      });
      profile = await ctx.db.get(profileId);
    } else if (profile.isPlatformAdmin !== true) {
      await ctx.db.patch(profile._id, { isPlatformAdmin: true });
    }

    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();
    if (tenant === null) {
      const tenantId = await ctx.db.insert("tenants", {
        slug: args.tenantSlug,
        name: args.tenantName,
        description: args.tenantDescription,
        status: "active",
        ownerId: user._id,
      });
      tenant = await ctx.db.get(tenantId);
    }
    if (tenant === null) throw new Error("unreachable: tenant insert failed");

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", tenant._id).eq("userId", user._id)
      )
      .unique();
    if (membership === null) {
      await ctx.db.insert("memberships", {
        tenantId: tenant._id,
        userId: user._id,
        role: "owner",
      });
    }

    return {
      userId: user._id,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      note: "bootstrap complete (idempotent)",
    };
  },
});
