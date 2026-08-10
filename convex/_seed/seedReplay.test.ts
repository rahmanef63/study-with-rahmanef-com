/// <reference types="vite/client" />
// THE REPLAY: what happens when the 2026-08-10 depth pass is seeded on top of a
// database that ALREADY ran the previous seeds. Production is that database —
// 6 published courses, 76 materi — so this is the only test that answers the
// question the deploy actually asks: how many rows land, and does anything the
// learners already have move, change or double?
//
// seedIdempotence.test.ts proves "re-running the SAME seed is a no-op". That is
// a weaker claim. Here the seed DATA has grown, so the correct answer is not
// zero — it is "exactly the appended materi and nothing else".
//
// How the live shape is rebuilt without vendoring the old seed files:
//   1. run the new seeds → every course at its NEW length;
//   2. rewind each course to its pre-pass length by deleting the placements
//      past `HEAD_LESSON_COUNT` and the materi they point at;
//   3. renumber what remains 0-BASED — the shape materiBackfill left in prod,
//      NOT the 1-based shape a fresh seed produces;
//   4. overwrite every surviving body with a SENTINEL, so "the seed did not
//      touch an existing row" is checked against a value the seed data does
//      not contain and cannot accidentally match.
// Step 2 is only legitimate because the pass is append-only, which is asserted
// independently in `appends, never rewrites` below.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import { SEED_COURSES } from "./coursesData";
import { EXTRA_COMMUNITIES } from "./communitiesData";

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

/**
 * Materi per course as PRODUCTION holds them today — the lesson-array lengths
 * at commit 55ed950, before the depth pass. Generated from
 * `git show HEAD:convex/_seed/<file>` and pinned here on purpose: this is the
 * baseline the replay is measured against, so it must not be derived from the
 * same arrays under test.
 */
const HEAD_LESSON_COUNT: Record<string, number> = {
  "dasar-ai": 4,
  "prompt-engineering": 4,
  "portofolio-dilirik": 2,
  "freelance-nol": 2,
  "ide-konten": 2,
  "skrip-caption": 2,
};
/** What the depth pass adds, per the arrays as they stand. */
const EXPECTED_NEW_MATERI = 52;
const SENTINEL = "<<<LIVE ROW — WRITTEN BY THE EARLIER SEED RUN>>>";

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: args.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, args);
  return t;
}
type T = Awaited<ReturnType<typeof bootstrapped>>;

async function runSeeds(t: T) {
  const content = await t.mutation(internal.seed.seedContent, seedArgs);
  const world = await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
  return {
    courses: content.courses + world.courses,
    lessons: content.lessons + world.lessons,
    placements: content.placements + world.placements,
    quizzes: content.quizzes + world.quizzes,
  };
}

/** Steps 2–4: turn a freshly seeded database into the live one. */
async function rewindToProduction(t: T) {
  return t.run(async (ctx) => {
    const kept: Record<string, string> = {};
    for (const course of await ctx.db.query("courses").collect()) {
      const head = HEAD_LESSON_COUNT[course.slug];
      expect(head, `unmapped course ${course.slug}`).toBeDefined();
      const places = (
        await ctx.db
          .query("courseLessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect()
      ).sort((a, b) => a.order - b.order);

      for (const [i, place] of places.entries()) {
        if (i >= head) {
          await ctx.db.delete(place._id);
          await ctx.db.delete(place.lessonId);
          continue;
        }
        await ctx.db.patch(place._id, { order: i }); // 0-based, as prod is
        await ctx.db.patch(place.lessonId, { contentMd: SENTINEL });
        const row = (await ctx.db.get(place.lessonId))!;
        kept[`${course.slug}|${row.title}`] = `${row.slug}|${i}`;
      }
    }
    return kept;
  });
}

async function census(t: T) {
  return t.run(async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    const places = await ctx.db.query("courseLessons").collect();
    return {
      lessons: lessons.length,
      places: places.length,
      slugs: lessons.map((l) => l.slug).sort(),
      sentinels: lessons.filter((l) => l.contentMd === SENTINEL).length,
    };
  });
}

describe("seed replay onto the LIVE database", () => {
  test("appends, never rewrites: every live title stays at its index", () => {
    // The data-level half of the claim. If a body or a title of an already-
    // seeded materi were edited, that edit would be DEAD CODE against prod
    // (the upsert only ever inserts), so the arrays must not pretend otherwise.
    const all = [
      ...SEED_COURSES,
      ...EXTRA_COMMUNITIES.flatMap((c) => c.courses),
    ];
    expect(all).toHaveLength(Object.keys(HEAD_LESSON_COUNT).length);
    for (const course of all) {
      const head = HEAD_LESSON_COUNT[course.slug];
      expect(head, `unmapped course ${course.slug}`).toBeDefined();
      expect(course.lessons.length).toBeGreaterThan(head);
      const titles = course.lessons.map((l) => l.title);
      expect(new Set(titles).size).toBe(titles.length); // no self-collision
    }
    const added = all.reduce((n, c) => n + c.lessons.length - HEAD_LESSON_COUNT[c.slug], 0);
    expect(added).toBe(EXPECTED_NEW_MATERI);
  });

  test("inserts EXACTLY the new materi — no duplicates, no renumbering", async () => {
    const t = await bootstrapped();
    await runSeeds(t);
    const kept = await rewindToProduction(t);
    const before = await census(t);
    expect(before.sentinels).toBe(before.lessons);

    const replay = await runSeeds(t);

    // The number this whole exercise exists to produce.
    expect(replay.lessons).toBe(EXPECTED_NEW_MATERI);
    expect(replay.placements).toBe(EXPECTED_NEW_MATERI);
    expect(replay.courses).toBe(0);
    expect(replay.quizzes).toBe(0);

    const after = await census(t);
    expect(after.lessons).toBe(before.lessons + EXPECTED_NEW_MATERI);
    expect(after.places).toBe(before.places + EXPECTED_NEW_MATERI);
    // Not one live body rewritten, and no live materi cloned onto a `-2` rung.
    expect(after.sentinels).toBe(before.lessons);
    expect(new Set(after.slugs).size).toBe(after.slugs.length);
    expect(after.slugs).toEqual(expect.arrayContaining(before.slugs));

    // Every pre-existing materi kept its slug AND its 0-based order.
    const now = await t.run(async (ctx) => {
      const out: Record<string, string> = {};
      for (const course of await ctx.db.query("courses").collect()) {
        for (const p of await ctx.db
          .query("courseLessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect()) {
          const row = (await ctx.db.get(p.lessonId))!;
          out[`${course.slug}|${row.title}`] = `${row.slug}|${p.order}`;
        }
      }
      return out;
    });
    for (const [key, was] of Object.entries(kept)) expect(now[key]).toBe(was);
  });

  test("a THIRD run — the deploy re-run — inserts nothing", async () => {
    const t = await bootstrapped();
    await runSeeds(t);
    await rewindToProduction(t);
    await runSeeds(t);
    const settled = await census(t);
    expect(await runSeeds(t)).toMatchObject({
      courses: 0,
      lessons: 0,
      placements: 0,
      quizzes: 0,
    });
    expect(await census(t)).toEqual(settled);
  });

  test("orders stay unique per course, appended above the high-water mark", async () => {
    const t = await bootstrapped();
    await runSeeds(t);
    await rewindToProduction(t);
    await runSeeds(t);

    await t.run(async (ctx) => {
      for (const course of await ctx.db.query("courses").collect()) {
        const orders = (
          await ctx.db
            .query("courseLessons")
            .withIndex("by_course", (q) => q.eq("courseId", course._id))
            .collect()
        ).map((p) => p.order);
        expect(new Set(orders).size).toBe(orders.length);
        const head = HEAD_LESSON_COUNT[course.slug];
        // 0..head-1 survived untouched; the appended ones all sit above them.
        expect(orders.filter((o) => o < head).sort()).toEqual(
          Array.from({ length: head }, (_, i) => i)
        );
      }
    });
  });
});
