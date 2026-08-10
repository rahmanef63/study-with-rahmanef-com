/// <reference types="vite/client" />
// createLesson / updateLesson — the SKILL half: `kind`, `promptText`, the cap,
// the "a prompt requires kind: skill" rule, and the authz-denied paths.
// Separate spec file from lessons.test.ts, one behaviour cluster per file
// (docs/rr-conventions.md "Test files … single-responsibility").
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { MAX_PROMPT_CHARS } from "../materi/validate";
import { asUser, seedMateri, seedTenantFixture, setup } from "./test.helpers";

const PROMPT = "Kamu adalah reviewer kode. Jelaskan risiko keamanan dari diff ini.";
const base = { title: "Review Kode", contentMd: "Penjelasan skill.", links: [] };

test("createLesson: a skill is one row — kind + promptText, and no course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
      kind: "skill",
      promptText: `  ${PROMPT}  `, // trimmed on the way in
    })) as Id<"lessons">;

  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.kind).toBe("skill");
  expect(lesson?.promptText).toBe(PROMPT);
  expect(lesson?.slug).toBe("review-kode"); // same slug machinery as a materi
  expect(lesson?.status).toBe("published");
});

test("createLesson: a materi leaves the kind column UNWRITTEN", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
    })) as Id<"lessons">;

  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  // Undefined MEANS "materi": the 76 production rows predate the column and
  // writing it for new materi would make them a second, pointless index band.
  expect(lesson?.kind).toBeUndefined();
  expect(lesson?.promptText).toBeUndefined();
});

test("createLesson: prompt without kind skill, empty prompt and over-cap prompt all fail", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const create = (extra: Record<string, unknown>) =>
    asInstructor.mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
      ...extra,
    });

  // A prompt on a plain materi is a skill nobody labelled — refuse it.
  await expect(create({ promptText: PROMPT })).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(create({ kind: "materi", promptText: PROMPT })).rejects.toThrow(
    /VALIDATION_FAILED/
  );
  await expect(create({ kind: "skill", promptText: "   " })).rejects.toThrow(
    /VALIDATION_FAILED/
  );
  await expect(
    create({ kind: "skill", promptText: "x".repeat(MAX_PROMPT_CHARS + 1) })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  // Exactly at the cap is fine.
  await create({ kind: "skill", promptText: "x".repeat(MAX_PROMPT_CHARS), slug: "pas-batas" });
});

test("createLesson: a skill needs instructor+ — anon and member are rejected", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const args = { tenantId: fx.tenantId, ...base, kind: "skill" as const, promptText: PROMPT };

  await expect(
    t.mutation(api.features.courses.lessons.createLesson, args)
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.lessons.createLesson, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("updateLesson: the prompt is editable and clearable, member denied", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
      kind: "skill",
      promptText: PROMPT,
    })) as Id<"lessons">;
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      promptText: "Prompt bajakan.",
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    promptText: "Prompt versi dua.",
  });
  expect((await t.run(async (ctx) => ctx.db.get(lessonId)))?.promptText).toBe("Prompt versi dua.");

  // null clears the column; absent would have left it alone.
  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    promptText: null,
  });
  expect((await t.run(async (ctx) => ctx.db.get(lessonId)))?.promptText).toBeUndefined();
});

test("updateLesson: the ROW's kind decides — no growing a prompt on a materi", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const materiId = await seedMateri(t, fx, { title: "Materi Biasa", slug: "materi-biasa" });

  await expect(
    t.withIdentity(asUser(fx.instructorId)).mutation(api.features.courses.lessons.updateLesson, {
      lessonId: materiId,
      promptText: PROMPT,
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  expect((await t.run(async (ctx) => ctx.db.get(materiId)))?.promptText).toBeUndefined();
});

test("updateLesson: an over-cap prompt is rejected and nothing else in the patch lands", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
      kind: "skill",
      promptText: PROMPT,
    })) as Id<"lessons">;

  await expect(
    t.withIdentity(asUser(fx.instructorId)).mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      title: "Judul Baru",
      promptText: "x".repeat(MAX_PROMPT_CHARS + 1),
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.title).toBe("Review Kode"); // the mutation is one transaction
  expect(lesson?.promptText).toBe(PROMPT);
});

// Placement stays ORTHOGONAL: a skill is not normally taught inside a course,
// but nothing forbids it — the join table does not know what a kind is.
test("a skill can still be placed in a course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const skillId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...base,
      kind: "skill",
      promptText: PROMPT,
    })) as Id<"lessons">;
  const courseId = await t.run(async (ctx) =>
    ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: "kelas-prompting",
      title: "Kelas Prompting",
      description: "Kelas yang mengajarkan sebuah skill.",
      status: "published",
      createdBy: fx.instructorId,
    })
  );

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.manage.addLessonToCourse, { courseId, lessonId: skillId });
  const overview = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getOverview, {
      tenantId: fx.tenantId,
      courseSlug: "kelas-prompting",
    });
  expect(overview.lessonCount).toBe(1);
});
