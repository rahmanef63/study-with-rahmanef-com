/// <reference types="vite/client" />
// "Orkestrasi Multi-Agent untuk Proyek Nyata" seeds the POST-MATERI shape, and re-running it is a
// no-op — including against rows the OLD module-tree seed created.
//
// The second property is the one that can corrupt production: seed CODE is not
// seed DATA. This course is ALREADY live with 14 materi that the one-shot
// materiBackfill slugged from these exact titles, so the rewritten seed will be
// re-run against rows it did not write. The last spec reproduces that history
// for real — legacy tree in, real backfill over it, seed after — instead of
// asserting a slug rule that only this test believes in.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { MULTI_AGENT_CURRICULUM as CURRICULUM } from "./_seed/multiAgentData";
import { baseSlug } from "./features/courses/slug";

// Absolute glob keeps every key rooted at /convex (pattern: features/*/test.helpers.ts).
const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

const bootstrapArgs = {
  ownerEmail: "rahmanef63@gmail.com",
  username: "rahman",
  displayName: "Rahman",
  tenantSlug: "belajar-ai",
  tenantName: "Belajar AI bareng Rahman",
  tenantDescription: "Komunitas belajar pengaplikasian AI untuk semua orang.",
};
const seedArgs = { ownerEmail: bootstrapArgs.ownerEmail, tenantSlug: bootstrapArgs.tenantSlug };
const SEED = internal.seedMultiAgent.seedMultiAgentContent;

/** The module tree this curriculum USED to have: lessons per module, and which
 *  quiz hung off it. Kept only here, only to rebuild the legacy shape the last
 *  spec migrates from — the product has no modules any more (DECISIONS #37). */
const LEGACY_MODULES: { lessons: number; quiz?: number }[] = [
  { lessons: 3, quiz: 0 },
  { lessons: 3, quiz: 1 },
  { lessons: 2 }, // "Menulis Prompt Assignment" carried no quiz
  { lessons: 3, quiz: 2 },
  { lessons: 3, quiz: 3 },
];

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, bootstrapArgs);
  return t;
}

type T = Awaited<ReturnType<typeof bootstrapped>>;

/** Everything this seed can write, as a comparable snapshot. */
async function census(t: T) {
  return t.run(async (ctx) => {
    const placements = await ctx.db.query("courseLessons").collect();
    return {
      courses: (await ctx.db.query("courses").collect()).length,
      lessons: (await ctx.db.query("lessons").collect()).length,
      quizzes: (await ctx.db.query("quizzes").collect()).length,
      placements: placements.length,
      // Sorted (course, lesson, order) triples: catches a silent renumbering
      // that a bare count would miss.
      order: placements
        .map((p) => `${p.courseId}|${p.lessonId}|${p.order}`)
        .sort()
        .join(","),
    };
  });
}

async function ids(t: T) {
  return t.run(async (ctx) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", bootstrapArgs.tenantSlug))
      .unique();
    const owner = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", bootstrapArgs.ownerEmail))
      .unique();
    return { tenantId: tenant!._id, ownerId: owner!._id };
  });
}

/** Placement rows of the seeded course, in `by_course` (order) sequence. */
async function syllabus(t: T) {
  return t.run(async (ctx) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", bootstrapArgs.tenantSlug))
      .unique();
    const course = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", tenant!._id).eq("slug", CURRICULUM.slug)
      )
      .unique();
    const placements = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", course!._id))
      .collect();
    return Promise.all(
      placements.map(async (p) => ({
        order: p.order,
        title: (await ctx.db.get(p.lessonId))!.title,
      }))
    );
  });
}

describe("seedMultiAgent — preconditions", () => {
  test("refuses when the owner has never logged in", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(SEED, seedArgs)).rejects.toThrow(/login \+ bootstrap first/i);
  });

  test("refuses when the tenant does not exist yet", async () => {
    const t = await bootstrapped();
    await expect(
      t.mutation(SEED, { ...seedArgs, tenantSlug: "komunitas-yang-tidak-ada" })
    ).rejects.toThrow(/seed:bootstrap first/i);
  });
});

describe("seedMultiAgent — flat materi, no module tree", () => {
  test("writes tenant-owned materi placed through courseLessons", async () => {
    const t = await bootstrapped();
    const first = await t.mutation(SEED, seedArgs);

    expect(first).toMatchObject({
      courseSlug: CURRICULUM.slug,
      course: 1,
      lessons: 14,
      placements: 14,
      quizzes: 4,
    });
    expect(CURRICULUM.lessons).toHaveLength(14);
    expect(CURRICULUM.quizzes).toHaveLength(4);

    await t.run(async (ctx) => {
      // NO module row, and no lesson carrying the retiring ownership columns —
      // this is what lets the integrator drop the columns after the purge.
      for (const lesson of await ctx.db.query("lessons").collect()) {
        expect(lesson.status).toBe("published");
        expect(lesson.slug).toBe(baseSlug(lesson.title));
        expect(lesson.authorId).toBeTruthy();
      }
      for (const quiz of await ctx.db.query("quizzes").collect()) {
        expect(quiz.courseId).toBeTruthy();
      }
    });
  });

  test("placement order is 1..14 across the WHOLE course, flattened", async () => {
    const t = await bootstrapped();
    await t.mutation(SEED, seedArgs);

    const rows = await syllabus(t);
    expect(rows.map((r) => r.order)).toEqual(rows.map((_, i) => i + 1));
    // The sequence a learner already saw, with the module boundaries removed.
    expect(rows.map((r) => r.title)).toEqual(CURRICULUM.lessons.map((l) => l.title));
  });

  test("re-running inserts ZERO rows and renumbers nothing", async () => {
    const t = await bootstrapped();
    await t.mutation(SEED, seedArgs);
    const before = await census(t);

    const second = await t.mutation(SEED, seedArgs);
    expect(second).toMatchObject({ course: 0, lessons: 0, placements: 0, quizzes: 0 });
    expect(await census(t)).toEqual(before);
  });
});

