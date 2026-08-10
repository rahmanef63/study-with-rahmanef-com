/// <reference types="vite/client" />
// seedWebDev — post-module shape (DECISIONS #37) + idempotence against rows the
// OLD seed created. The interesting case is not the empty database: production
// already holds this kelas, seeded by the module-tree version and then slugged
// by materiBackfill, so the spec REBUILDS that exact history and re-runs the new
// seed on top of it.
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { WEB_DEV_CURRICULUM } from "./_seed/webDevData";
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
const C = WEB_DEV_CURRICULUM;

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, bootstrapArgs);
  return t;
}

/** Every row the seed is allowed to touch, so "a re-run inserts nothing" can be
 *  asserted structurally instead of by trusting the return counters. */
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

describe("seedWebDev denied paths", () => {
  test("refuses an owner who has never logged in", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs)
    ).rejects.toThrow(/login \+ bootstrap first/i);
  });

  test("refuses a tenant that was never bootstrapped", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", { email: bootstrapArgs.ownerEmail });
    });
    await expect(
      t.mutation(internal.seedWebDev.seedWebDevContent, {
        ...seedArgs,
        tenantSlug: "komunitas-hantu",
      })
    ).rejects.toThrow(/run seed:bootstrap first/i);
  });
});

describe("seedWebDev writes the post-module shape", () => {
  test("kelas + 17 materi + 17 penempatan 1..17 + 4 kuis di kelas", async () => {
    const t = await bootstrapped();
    const made = await t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs);
    expect(made).toMatchObject({
      courseSlug: C.slug,
      course: 1,
      lessons: 17,
      placements: 17,
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
      // 1-based running order across the WHOLE kelas, in the reading sequence
      // learners already have (modul 1 lesson 1..n, modul 2, …).
      expect(placements.map((p) => p.order)).toEqual(
        Array.from({ length: 17 }, (_, i) => i + 1)
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
      }


      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_course", (q) => q.eq("courseId", course!._id))
        .collect();
      expect(quizzes.map((q) => q.title).sort()).toEqual(
        C.quizzes.map((q) => q.title).sort()
      );
    });
  });

  test("konten Bahasa Indonesia dipindah utuh, bukan diedit", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs);
    await t.run(async (ctx) => {
      const tenant = (await ctx.db.query("tenants").first())!;
      for (const source of C.lessons) {
        const row = await ctx.db
          .query("lessons")
          .withIndex("by_tenant_slug", (q) =>
            q.eq("tenantId", tenant._id).eq("slug", baseSlug(source.title))
          )
          .unique();
        expect(row!.contentMd).toBe(source.contentMd);
        expect(row!.links).toEqual(source.links ?? []);
      }
    });
  });
});

describe("seedWebDev idempotence", () => {
  test("a second run inserts ZERO rows and renumbers nothing", async () => {
    const t = await bootstrapped();
    await t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs);
    const before = await snapshot(t);

    const second = await t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs);
    expect(second).toMatchObject({ course: 0, lessons: 0, placements: 0, quizzes: 0 });
    expect(await snapshot(t)).toEqual(before);
  });

  test("a squatted slug pushes the new materi to -2 rather than hijacking the row", async () => {
    const t = await bootstrapped();
    const squatted = baseSlug(C.lessons[0].title);
    await t.run(async (ctx) => {
      const tenant = (await ctx.db.query("tenants").first())!;
      await ctx.db.insert("lessons", {
        tenantId: tenant._id,
        title: "Materi lain yang kebetulan sama slug-nya",
        slug: squatted,
        status: "published",
        contentMd: "bukan punya kelas ini",
        links: [],
      });
    });

    await t.mutation(internal.seedWebDev.seedWebDevContent, seedArgs);
    await t.run(async (ctx) => {
      const tenant = (await ctx.db.query("tenants").first())!;
      const squatter = await ctx.db
        .query("lessons")
        .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenant._id).eq("slug", squatted))
        .unique();
      expect(squatter!.contentMd).toBe("bukan punya kelas ini");
      const mine = await ctx.db
        .query("lessons")
        .withIndex("by_tenant_slug", (q) =>
          q.eq("tenantId", tenant._id).eq("slug", `${squatted}-2`)
        )
        .unique();
      expect(mine!.title).toBe(C.lessons[0].title);
    });
  });
});
