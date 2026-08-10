// seed:seedContent — fills the bootstrapped tenant with the starter courses
// from _seed/coursesData.ts plus a pinned welcome post.
//
// IDEMPOTENT PER ROW, not per course. The old writer skipped a course whose
// slug already existed, assuming its modules/lessons/quiz came with it. Materi
// are tenant-owned now (DECISIONS #36) and production already holds these
// courses, so every write is instead gated on a probe of its own destination —
// see curriculum.ts for the three probes. A re-run inserts nothing.
import type { MutationCtx } from "../_generated/server";
import { upsertCurriculum } from "./curriculum";
import { upsertSeedPost } from "./posts";
import { SEED_COURSES } from "./coursesData";

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
  const made = { courses: 0, lessons: 0, placements: 0, quizzes: 0 };
  let posts = 0;

  for (const curriculum of SEED_COURSES) {
    const one = await upsertCurriculum(ctx, { tenantId, createdBy, curriculum });
    made.courses += one.course;
    made.lessons += one.lessons;
    made.placements += one.placements;
    made.quizzes += one.quizzes;
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
  if (madeWelcome) posts++;

  return { note: "content seed complete (idempotent)", ...made, posts };
}
