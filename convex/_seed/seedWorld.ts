// seed:seedWorld — the non-flagship communities from _seed/communitiesData.ts,
// each with courses, a pinned welcome post and curated "sumber" posts.
// Idempotent: tenants by slug, courses/materi/placements/quizzes through the
// destination probes in curriculum.ts, posts by (tenant, kind, title).
import type { MutationCtx } from "../_generated/server";
import { upsertCurriculum } from "./curriculum";
import { upsertSeedPost } from "./posts";
import { EXTRA_COMMUNITIES } from "./communitiesData";

export type SeedWorldArgs = { ownerEmail: string };

export async function runSeedWorld(ctx: MutationCtx, args: SeedWorldArgs) {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", args.ownerEmail))
    .unique();
  if (user === null) {
    throw new Error(`No user with email ${args.ownerEmail} — run seed:bootstrap first.`);
  }
  const createdBy = user._id;
  const made = {
    tenants: 0, pengumuman: 0, sumber: 0, covers: 0,
    courses: 0, lessons: 0, placements: 0, quizzes: 0,
  };

  // No cover patch on the flagship. Communities render procedural pixel art
  // from their slug (slices/courses/lib/cover-art.ts); pointing them at
  // picsum.photos put a third-party stock host in the request path of a
  // zero-cost product.

  for (const co of EXTRA_COMMUNITIES) {
    let tenant = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", co.slug)).unique();
    if (tenant === null) {
      const newId = await ctx.db.insert("tenants", {
        slug: co.slug, name: co.name, description: co.description, status: "active", ownerId: createdBy,
        ...(co.track ? { track: co.track } : {}),
        ...(co.coverImageUrl ? { coverImageUrl: co.coverImageUrl } : {}),
      });
      await ctx.db.insert("memberships", { tenantId: newId, userId: createdBy, role: "owner" });
      tenant = await ctx.db.get(newId);
      made.tenants++;
    } else if (!tenant.coverImageUrl && co.coverImageUrl) {
      await ctx.db.patch(tenant._id, { coverImageUrl: co.coverImageUrl });
      made.covers++;
    }
    if (tenant === null) continue;
    const tenantId = tenant._id;

    for (const curriculum of co.courses) {
      const one = await upsertCurriculum(ctx, { tenantId, createdBy, curriculum });
      made.courses += one.course;
      made.lessons += one.lessons;
      made.placements += one.placements;
      made.quizzes += one.quizzes;
    }

    const welcome = await upsertSeedPost(ctx, {
      tenantId, authorId: createdBy, kind: "pengumuman", pinned: true,
      title: co.welcome.title, bodyMd: co.welcome.bodyMd,
    });
    if (welcome.created) made.pengumuman++;

    for (const r of co.sumber ?? []) {
      const post = await upsertSeedPost(ctx, {
        tenantId, authorId: createdBy, kind: "sumber",
        title: r.title, bodyMd: r.note ?? "", linkUrl: r.url,
      });
      if (post.created) made.sumber++;
    }
  }

  return { note: "world seed complete (idempotent)", ...made };
}
