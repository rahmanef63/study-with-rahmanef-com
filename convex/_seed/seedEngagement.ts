// Keep the documented entry point, but seed only owner-curated resources.
// Synthetic members, conversations, suggestions and likes must never return.
import type { MutationCtx } from "../_generated/server";
import { upsertSeedPost } from "./posts";
import { SEED_RESOURCES } from "./engagementData";

export type SeedEngagementArgs = { ownerEmail: string; tenantSlug: string };

export async function runSeedEngagement(ctx: MutationCtx, args: SeedEngagementArgs) {
  const owner = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", args.ownerEmail)).unique();
  const tenant = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug)).unique();
  if (!owner || !tenant || tenant.ownerId !== owner._id) throw new Error("Seed owner or community not found");
  const made = { members: 0, memberships: 0, sumber: 0, comments: 0, usulan: 0, likes: 0, skipped: 0 };
  for (const [index, resource] of SEED_RESOURCES.entries()) {
    const post = await upsertSeedPost(ctx, {
      tenantId: tenant._id, authorId: owner._id, kind: "sumber",
      title: resource.title, bodyMd: resource.note ?? "", linkUrl: resource.url,
      lastActivityAt: Date.now() - index * 60_000,
    });
    if (post.created) made.sumber++;
    else made.skipped++;
  }
  return { note: "owner-curated resource seed complete (no synthetic engagement)", ...made };
}
