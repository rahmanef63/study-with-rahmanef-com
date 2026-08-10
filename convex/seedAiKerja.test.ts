/// <reference types="vite/client" />
// seedAiKerja — post-module shape (DECISIONS #37) + idempotence against rows the
// OLD seed created. Same battery as seedWebDev.test.ts, run against the other
// curriculum: the two seeds share `_seed/curriculum.upsertCurriculum`, and a
// shared helper that is only exercised by one caller is only half-tested.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { AI_KERJA_CURRICULUM } from "./_seed/aiKerjaData";
import { baseSlug } from "./features/courses/slug";

const modules = import.meta.glob(["./**/*.{js,ts}", "!./**/*.test.ts", "!./**/*.d.ts"]);

const bootstrapArgs = {
  ownerEmail: "rahmanef63@gmail.com",
  username: "rahman",
  displayName: "Rahman",
  tenantSlug: "belajar-ai",
  tenantName: "Belajar AI bareng Rahman",
  tenantDescription: "Komunitas belajar pengaplikasian AI untuk semua orang.",
};
const seedArgs = { ownerEmail: bootstrapArgs.ownerEmail, tenantSlug: bootstrapArgs.tenantSlug };
const C = AI_KERJA_CURRICULUM;

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, bootstrapArgs);
  return t;
}

async function snapshot(t: Awaited<ReturnType<typeof bootstrapped>>) {
  return t.run(async (ctx) => {
    const lessons = await ctx.db.query("lessons").collect();
    const placements = await ctx.db.query("courseLessons").collect();
    const quizzes = await ctx.db.query("quizzes").collect();
    const courses = await ctx.db.query("courses").collect();
    return {
      courses: courses.length,
      lessons: lessons.map((l) => `${l._id}|${l.slug}|${l.title}`).sort(),
      placements: placements.map((p) => `${p.courseId}|${p.lessonId}|${p.order}`).sort(),
      quizzes: quizzes.map((q) => `${q._id}|${q.courseId}|${q.title}`).sort(),
    };
  });
}

describe("seedAiKerja denied paths", () => {
  test("refuses an owner who has never logged in", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.seedAiKerja.seedAiKerjaContent, seedArgs)
    ).rejects.toThrow(/login \+ bootstrap first/i);
  });

  test("refuses a tenant that was never bootstrapped", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
    });
    await expect(
      t.mutation(internal.seedAiKerja.seedAiKerjaContent, {
        ...seedArgs,
        tenantSlug: "komunitas-hantu",
      })
    ).rejects.toThrow(/run seed:bootstrap first/i);
  });
});

describe("seedAiKerja writes the post-module shape", () => {
  test("kelas + 14 materi + 14 penempatan 1..14 + 4 kuis di kelas", async () => {
    const t = await bootstrapped();
    const made = await t.mutation(internal.seedAiKerja.seedAiKerjaContent, seedArgs);
    expect(made).toMatchObject({
      courseSlug: C.slug,
      course: 1,
      lessons: 14,
      placements: 14,
      quizzes: 4,
    });

    await t.run(async (ctx) => {
      const tenant = (await ctx.db.query("tenants").first())!;
      const course = await ctx.db
        .query("courses")
        .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenant._id).eq("slug", C.slug))
        .unique();
      expect(course).not.toBeNull();

      const placements = await ctx.db
        .query("courseLessons")
        .withIndex("by_course", (q) => q.eq("courseId", course!._id))
        .collect();
      expect(placements.map((p) => p.order)).toEqual(
        Array.from({ length: 14 }, (_, i) => i + 1)
      );
      const titles = await Promise.all(
        placements.map(async (p) => (await ctx.db.get(p.lessonId))!.title)
      );
      expect(titles).toEqual(C.lessons.map((l) => l.title));

      for (const p of placements) {
        const materi = (await ctx.db.get(p.lessonId))!;
        expect(materi.status).toBe("published");
        expect(materi.authorId).toBeDefined();
        expect(materi.slug).toBe(baseSlug(materi.title));
        expect(materi.contentMd).toBe(
          C.lessons.find((l) => l.title === materi.title)!.contentMd
        );
      }

      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_course", (q) => q.eq("courseId", course!._id))
        .collect();
      expect(quizzes.map((q) => q.title).sort()).toEqual(
        C.quizzes.map((q) => q.title).sort()
      );
      // Passing scores are part of the content contract (60–70%), not defaults.
      expect(quizzes.map((q) => q.passingScorePct).sort()).toEqual(
        C.quizzes.map((q) => q.passingScorePct).sort()
      );
    });
  });
});

describe("seedAiKerja idempotence", () => {
  test("a second run inserts ZERO rows and renumbers nothing", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seedAiKerja.seedAiKerjaContent, seedArgs);
    const before = await snapshot(t);

    const second = await t.mutation(internal.seedAiKerja.seedAiKerjaContent, seedArgs);
    expect(second).toMatchObject({ course: 0, lessons: 0, placements: 0, quizzes: 0 });
    expect(await snapshot(t)).toEqual(before);
  });

});
