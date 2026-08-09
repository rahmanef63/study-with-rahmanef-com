// seed:bootstrap — the FIRST tenant, and the ONLY grantor of
// profiles.isPlatformAdmin. P0-guarded by being internal-only: there is no
// other path to platform admin anywhere in the codebase, so nothing here may
// become callable from a client. Run once, after the owner has logged in with
// Google. Idempotent: existing rows are kept.
import type { MutationCtx } from "../_generated/server";
import type { SeedCourse } from "./types";

export type BootstrapArgs = { ownerEmail: string; username: string; displayName: string; tenantSlug: string; tenantName: string; tenantDescription: string };

export async function runBootstrap(ctx: MutationCtx, args: BootstrapArgs) {
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
}
