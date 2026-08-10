// seed:seedWorld — the non-flagship communities from _seed/communitiesData.ts,
// each with courses, a pinned welcome post and curated "sumber" posts, plus a
// cover back-filled onto the flagship. Idempotent: tenants and courses by slug,
// posts by (tenant, kind, title).
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { upsertSeedPost } from "./posts";
import { EXTRA_COMMUNITIES } from "./communitiesData";
import type { SeedCourse } from "./types";

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
  const made = { tenants: 0, courses: 0, modules: 0, lessons: 0, quizzes: 0, pengumuman: 0, sumber: 0, covers: 0 };

  // Seed a course tree into a tenant (idempotent by course slug).
  async function seedCourse(tenantId: Id<"tenants">, c: SeedCourse) {
    const existing = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", c.slug))
      .unique();
    if (existing !== null) return;
    const courseId = await ctx.db.insert("courses", {
      tenantId, slug: c.slug, title: c.title, description: c.description, status: "published", createdBy,
    });
    made.courses++;
    for (let mi = 0; mi < c.modules.length; mi++) {
      const m = c.modules[mi];
      const moduleId = await ctx.db.insert("modules", { tenantId, courseId, title: m.title, order: mi });
      made.modules++;
      for (let li = 0; li < m.lessons.length; li++) {
        const l = m.lessons[li];
        await ctx.db.insert("lessons", {
          tenantId, courseId, moduleId, title: l.title, contentMd: l.contentMd, links: l.links ?? [], order: li,
        });
        made.lessons++;
      }
      if (m.quiz) {
        await ctx.db.insert("quizzes", {
          tenantId, courseId, moduleId, title: m.quiz.title, passingScorePct: m.quiz.passingScorePct,
          questions: m.quiz.questions.map((q) => ({
            prompt: q.prompt, options: q.options, correctIndex: q.correctIndex,
            ...(q.explanation ? { explanation: q.explanation } : {}),
          })),
        });
        made.quizzes++;
      }
    }
  }

  // Back-fill a cover on the flagship community if it has none.
  const flagship = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", "belajar-ai")).unique();
  if (flagship && !flagship.coverImageUrl) {
    // No cover patch. Communities render procedural pixel art from their slug
    // (slices/courses/lib/cover-art.ts); pointing them at picsum.photos put a
    // third-party stock host in the request path of a zero-cost product.
    made.covers++;
  }

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

    for (const c of co.courses) await seedCourse(tenantId, c);

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
