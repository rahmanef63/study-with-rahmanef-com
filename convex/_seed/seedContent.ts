// seed:seedContent — fills the bootstrapped tenant with the starter courses
// from _seed/coursesData.ts plus a pinned welcome post. Idempotent PER COURSE:
// a slug that already exists is skipped whole, on the assumption its
// modules/lessons/quiz came with it.
import type { MutationCtx } from "../_generated/server";
import { upsertSeedPost } from "./posts";
import { SEED_COURSES } from "./coursesData";
import type { SeedCourse } from "./types";

export type SeedContentArgs = { ownerEmail: string; tenantSlug: string };

export async function runSeedContent(ctx: MutationCtx, args: SeedContentArgs) {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", args.ownerEmail))
    .unique();
  if (user === null) {
    throw new Error(`No user with email ${args.ownerEmail} — run seed:bootstrap first.`);
  }
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
    .unique();
  if (tenant === null) {
    throw new Error(`No tenant "${args.tenantSlug}" — run seed:bootstrap first.`);
  }
  const tenantId = tenant._id;
  const createdBy = user._id;
  const made = { courses: 0, modules: 0, lessons: 0, quizzes: 0, posts: 0, skipped: 0 };

  for (const c of SEED_COURSES) {
    const existing = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", c.slug))
      .unique();
    if (existing !== null) {
      made.skipped++;
      continue; // idempotent: course already seeded, leave it (and its children) alone
    }
    const courseId = await ctx.db.insert("courses", {
      tenantId,
      slug: c.slug,
      title: c.title,
      description: c.description,
      status: "published",
      createdBy,
    });
    made.courses++;

    for (let mi = 0; mi < c.modules.length; mi++) {
      const m = c.modules[mi];
      const moduleId = await ctx.db.insert("modules", {
        tenantId,
        courseId,
        title: m.title,
        order: mi,
      });
      made.modules++;

      for (let li = 0; li < m.lessons.length; li++) {
        const l = m.lessons[li];
        await ctx.db.insert("lessons", {
          tenantId,
          courseId,
          moduleId,
          title: l.title,
          contentMd: l.contentMd,
          links: l.links ?? [],
          order: li,
        });
        made.lessons++;
      }

      if (m.quiz) {
        await ctx.db.insert("quizzes", {
          tenantId,
          courseId,
          moduleId,
          title: m.quiz.title,
          passingScorePct: m.quiz.passingScorePct,
          questions: m.quiz.questions.map((q) => ({
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            ...(q.explanation ? { explanation: q.explanation } : {}),
          })),
        });
        made.quizzes++;
      }
    }
  }

  // Welcome pengumuman — a PINNED post on the Diskusi feed (#33: the
  // announcements board is gone; an announcement is a post kind).
  const { created: madeWelcome } = await upsertSeedPost(ctx, {
    tenantId,
    authorId: createdBy,
    kind: "pengumuman",
    pinned: true,
    title: "Selamat datang di Belajar AI! 🎉",
    bodyMd: `Komunitas ini baru dibuka 🌱 Sudah ada **2 kelas** untuk mulai:

- **Dasar AI untuk Semua** — kenali AI, ML, dan LLM dari nol.
- **Prompt Engineering Praktis** — susun prompt yang akurat & konsisten.

Buka tab **Kelas**, pilih satu, dan catat progresmu. Selamat belajar — bareng-bareng!`,
  });
  if (madeWelcome) made.posts++;

  return { note: "content seed complete (idempotent)", ...made };
}
