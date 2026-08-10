/// <reference types="vite/client" />
// Backfill specs: the flatten must preserve the exact order a learner already
// sees, fill the new columns, and be safe to re-run.
import { expect, test } from "vitest";
import { materiBackfillRef } from "./refs";
import { seedTenantFixture, setup } from "./test.helpers";

/** A PRE-MIGRATION course: the module tree, no `courseLessons`, no slugs. The
 *  shared seedCourse helper now seeds the materi model, which is exactly what
 *  this one-shot exists to produce — so the legacy shape is built here. */
async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const cm = await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: "kelas-lawas",
      title: "Kelas lawas",
      description: "Kelas dengan pohon modul",
      status: "published",
      createdBy: fx.instructorId,
    });
    const m1 = await ctx.db.insert("modules", {
      tenantId: fx.tenantId,
      courseId,
      title: "Modul satu",
      order: 1,
    });
    const lessonId = await ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      courseId,
      moduleId: m1,
      title: "Materi A1",
      contentMd: "isi",
      links: [],
      order: 1,
    });
    // A second module with two lessons, so the flatten has something to order.
    const m2 = await ctx.db.insert("modules", {
      tenantId: fx.tenantId,
      courseId,
      title: "Modul dua",
      order: 2,
    });
    for (const [i, title] of ["Materi B1", "Materi B2"].entries()) {
      await ctx.db.insert("lessons", {
        tenantId: fx.tenantId,
        courseId,
        moduleId: m2,
        title,
        contentMd: "isi",
        links: [],
        order: i,
      });
    }
    return { courseId, lessonId };
  });
  return { t, fx, cm };
}

const placements = (t: ReturnType<typeof setup>) =>
  t.run(async (ctx) => ctx.db.query("courseLessons").collect());

test("flattens module order then lesson order into one sequence", async () => {
  const { t } = await fixture();
  await t.mutation(materiBackfillRef, {});
  const rows = (await placements(t)).sort((a, b) => a.order - b.order);
  const titles = await t.run(async (ctx) =>
    Promise.all(rows.map(async (r) => (await ctx.db.get(r.lessonId))?.title))
  );
  // Module 0's lesson(s) first, then module 1's two, in their own order.
  expect(titles.slice(-2)).toEqual(["Materi B1", "Materi B2"]);
  expect(rows.map((r) => r.order)).toEqual(rows.map((_, i) => i));
});

test("fills slug / status / authorId, and slugs are unique per tenant", async () => {
  const { t, fx } = await fixture();
  await t.mutation(materiBackfillRef, {});
  const lessons = await t.run(async (ctx) => ctx.db.query("lessons").collect());
  expect(lessons.every((l) => l.slug !== undefined)).toBe(true);
  // Legacy rows were live by definition — drafts were a course-level concept.
  expect(lessons.every((l) => l.status === "published")).toBe(true);
  expect(lessons.every((l) => l.authorId !== undefined)).toBe(true);
  const slugs = lessons.filter((l) => l.tenantId === fx.tenantId).map((l) => l.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

test("a second full run inserts nothing and re-slugs nothing", async () => {
  const { t } = await fixture();
  const first = await t.mutation(materiBackfillRef, {});
  const before = (await placements(t)).length;
  const second = await t.mutation(materiBackfillRef, {});
  expect(first.placements).toBeGreaterThan(0);
  expect(second.placements).toBe(0);
  expect(second.slugged).toBe(0);
  expect((await placements(t)).length).toBe(before);
});

test("identical titles in one tenant get distinct slugs", async () => {
  const { t, fx, cm } = await fixture();
  await t.run(async (ctx) => {
    const m = await ctx.db.insert("modules", {
      tenantId: fx.tenantId, courseId: cm.courseId, title: "Modul tiga", order: 3,
    });
    for (let i = 0; i < 3; i++) {
      await ctx.db.insert("lessons", {
        tenantId: fx.tenantId, courseId: cm.courseId, moduleId: m,
        title: "Judul Sama", contentMd: "x", links: [], order: i,
      });
    }
  });
  await t.mutation(materiBackfillRef, {});
  const same = (await t.run(async (ctx) => ctx.db.query("lessons").collect()))
    .filter((l) => l.title === "Judul Sama")
    .map((l) => l.slug);
  expect(same).toHaveLength(3);
  expect(new Set(same).size).toBe(3);
});
