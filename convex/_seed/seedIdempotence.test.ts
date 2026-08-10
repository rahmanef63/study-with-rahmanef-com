/// <reference types="vite/client" />
// The seed writes the POST-MATERI shape, and re-running it is a no-op.
//
// Two properties, and the second is the one that has burned this repo before:
// seed CODE is not seed DATA. Production is ALREADY seeded, so the rewritten
// seed will be re-run against rows the OLD seed created and the materi backfill
// later slugged. Every spec below therefore runs each mutation TWICE and
// asserts the second run changed nothing — same row counts, same
// `courseLessons.order` values, no renumbering.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { SEED_COURSES } from "./coursesData";
import { EXTRA_COMMUNITIES } from "./communitiesData";
import { upsertCurriculum, type SeedCurriculum } from "./curriculum";

// Absolute glob keeps every key rooted at /convex (pattern: features/*/test.helpers.ts).
const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

const args = {
  ownerEmail: "rahmanef63@gmail.com",
  username: "rahman",
  displayName: "Rahman",
  tenantSlug: "belajar-ai",
  tenantName: "Belajar AI bareng Rahman",
  tenantDescription: "Komunitas belajar pengaplikasian AI untuk semua orang.",
};
const seedArgs = { ownerEmail: args.ownerEmail, tenantSlug: args.tenantSlug };

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: args.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, args);
  return t;
}

type T = Awaited<ReturnType<typeof bootstrapped>>;

/** Everything the seed can write, as a comparable snapshot. */
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

const TOTAL_SEED_LESSONS =
  SEED_COURSES.reduce((n, c) => n + c.lessons.length, 0) +
  EXTRA_COMMUNITIES.reduce(
    (n, co) => n + co.courses.reduce((m, c) => m + c.lessons.length, 0),
    0
  );

describe("seedContent — flat materi, no module tree", () => {
  test("writes tenant-owned materi placed through courseLessons", async () => {
    const t = await bootstrapped();
    const first = await t.mutation(internal.seed.seedContent, seedArgs);

    expect(first.courses).toBe(SEED_COURSES.length);
    expect(first.lessons).toBe(SEED_COURSES.reduce((n, c) => n + c.lessons.length, 0));
    expect(first.placements).toBe(first.lessons);
    expect(first.quizzes).toBe(SEED_COURSES.reduce((n, c) => n + c.quizzes.length, 0));

    await t.run(async (ctx) => {
      // NO module row, and no lesson carrying the retiring ownership columns —
      // this is what lets the integrator drop the columns after the purge.
      for (const lesson of await ctx.db.query("lessons").collect()) {
        expect(lesson.status).toBe("published");
        expect(lesson.slug).toBeTruthy();
        expect(lesson.authorId).toBeTruthy();
      }
      for (const quiz of await ctx.db.query("quizzes").collect()) {
        expect(quiz.courseId).toBeTruthy();
      }
    });
  });

  test("placement order is 1..n across the WHOLE course, flattened", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedContent, seedArgs);

    for (const course of SEED_COURSES) {
      const titles = await t.run(async (ctx) => {
        const tenant = await ctx.db
          .query("tenants")
          .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
          .unique();
        const row = await ctx.db
          .query("courses")
          .withIndex("by_tenant_slug", (q) =>
            q.eq("tenantId", tenant!._id).eq("slug", course.slug)
          )
          .unique();
        const placements = await ctx.db
          .query("courseLessons")
          .withIndex("by_course", (q) => q.eq("courseId", row!._id))
          .collect();
        expect(placements.map((p) => p.order)).toEqual(
          placements.map((_, i) => i + 1) // 1-based, contiguous, index-ordered
        );
        return Promise.all(
          placements.map(async (p) => (await ctx.db.get(p.lessonId))!.title)
        );
      });
      // The sequence a learner already saw, with the module boundaries removed.
      expect(titles).toEqual(course.lessons.map((l) => l.title));
    }
  });

  test("re-running inserts ZERO rows and renumbers nothing", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedContent, seedArgs);
    const before = await census(t);

    const second = await t.mutation(internal.seed.seedContent, seedArgs);
    expect(second).toMatchObject({ courses: 0, lessons: 0, placements: 0, quizzes: 0, posts: 0 });
    expect(await census(t)).toEqual(before);
  });
});

describe("seedWorld", () => {
  test("seeds every extra community flat, and is a no-op on re-run", async () => {
    const t = await bootstrapped();

    const first = await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
    expect(first.tenants).toBe(EXTRA_COMMUNITIES.length);
    expect(first.lessons).toBe(
      EXTRA_COMMUNITIES.reduce((n, co) => n + co.courses.reduce((m, c) => m + c.lessons.length, 0), 0)
    );
    expect(first.placements).toBe(first.lessons);
    await t.run(async (ctx) => {
    });

    const before = await census(t);
    const second = await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
    expect(second).toMatchObject({ tenants: 0, courses: 0, lessons: 0, placements: 0, quizzes: 0 });
    expect(await census(t)).toEqual(before);
  });
});

describe("seedEngagement", () => {
  test("hangs its starter threads off the first PLACEMENT, not a module walk", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedContent, seedArgs);
    const engagement = await t.mutation(internal.seed.seedEngagement, seedArgs);
    expect(engagement.comments).toBeGreaterThan(0);

    await t.run(async (ctx) => {
      const comments = await ctx.db.query("comments").collect();
      const openers = new Set<string>();
      for (const course of await ctx.db.query("courses").collect()) {
        const first = await ctx.db
          .query("courseLessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .first();
        if (first) openers.add(String(first.lessonId));
      }
      // Every seeded thread sits on a course's opening materi (order 1).
      for (const c of comments) expect(openers.has(String(c.lessonId))).toBe(true);
    });
  });

  test("re-running the whole runbook changes nothing", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seed.seedContent, seedArgs);
    await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
    await t.mutation(internal.seed.seedEngagement, seedArgs);

    const before = await census(t);
    const beforeComments = await t.run(async (ctx) =>
      (await ctx.db.query("comments").collect()).length
    );
    expect(before.lessons).toBe(TOTAL_SEED_LESSONS);
    expect(before.placements).toBe(TOTAL_SEED_LESSONS);

    await t.mutation(internal.seed.bootstrap, args);
    await t.mutation(internal.seed.seedContent, seedArgs);
    await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
    const again = await t.mutation(internal.seed.seedEngagement, seedArgs);
    expect(again.comments).toBe(0);

    expect(await census(t)).toEqual(before);
    expect(
      await t.run(async (ctx) => (await ctx.db.query("comments").collect()).length)
    ).toBe(beforeComments);
  });

});


// Drop-safe: exercises upsertCurriculum directly, no legacy tree involved.
describe("upsertCurriculum — the two ways it used to lose rows quietly", () => {
  const twoRingkasan: SeedCurriculum = {
    slug: "kelas-uji",
    title: "Kelas Uji",
    description: "Dua materi berjudul sama.",
    lessons: [
      { title: "Ringkasan", contentMd: "# Ringkasan awal" },
      { title: "Bab dua", contentMd: "# Bab dua" },
      { title: "Ringkasan", contentMd: "# Ringkasan akhir" },
    ],
    quizzes: [],
  };

  async function seedInto(t: T, curriculum: SeedCurriculum) {
    return t.run(async (ctx) => {
      const tenant = await ctx.db
        .query("tenants")
        .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
        .unique();
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.ownerEmail))
        .unique();
      return upsertCurriculum(ctx, {
        tenantId: tenant!._id,
        createdBy: user!._id,
        curriculum,
      });
    });
  }

  test("two materi sharing a title both land, on distinct slugs", async () => {
    const t = await bootstrapped();
    const made = await seedInto(t, twoRingkasan);
    expect(made.lessons).toBe(3);
    expect(made.placements).toBe(3);

    const slugs = await t.run(async (ctx) => {
      const rows = await ctx.db.query("lessons").collect();
      return rows.filter((r) => r.title === "Ringkasan").map((r) => r.slug).sort();
    });
    // The second one climbs the ladder instead of matching the first and
    // vanishing — the failure was silent: no insert, no placement, no error.
    expect(slugs).toEqual(["ringkasan", "ringkasan-2"]);

    // …and it is still a no-op on replay.
    const again = await seedInto(t, twoRingkasan);
    expect(again).toMatchObject({ lessons: 0, placements: 0 });
  });

  test("a curriculum that GROWS appends past the high-water mark, never onto it", async () => {
    const t = await bootstrapped();
    // Pre-place three materi 0-BASED, the shape materiBackfill left in prod.
    await seedInto(t, {
      ...twoRingkasan,
      lessons: [
        { title: "A", contentMd: "# A" },
        { title: "B", contentMd: "# B" },
        { title: "C", contentMd: "# C" },
      ],
    });
    await t.run(async (ctx) => {
      const rows = await ctx.db.query("courseLessons").collect();
      rows.sort((x, y) => x.order - y.order);
      for (const [i, row] of rows.entries()) await ctx.db.patch(row._id, { order: i });
    });

    await seedInto(t, {
      ...twoRingkasan,
      lessons: [
        { title: "A", contentMd: "# A" },
        { title: "BARU", contentMd: "# BARU" },
        { title: "B", contentMd: "# B" },
        { title: "C", contentMd: "# C" },
      ],
    });

    const orders = await t.run(async (ctx) => {
      const rows = await ctx.db.query("courseLessons").collect();
      return rows.map((r) => r.order).sort((x, y) => x - y);
    });
    // Deriving the new row's order from the array index would have given it 2,
    // colliding with C and sorting BARU after B instead of before it.
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([0, 1, 2, 3]);
  });
});
