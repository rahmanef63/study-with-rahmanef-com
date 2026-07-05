/// <reference types="vite/client" />
// Course + module mutations — authz-denied paths (P0), per-tenant slug
// uniqueness, publish gate, reorder permutation guard, delete invariants.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedCourse, seedTenantFixture, setup } from "./test.helpers";

const createArgs = (tenantId: Id<"tenants">) => ({
  tenantId,
  slug: "kelas-baru",
  title: "Kelas Baru AI",
  description: "Belajar pengaplikasian AI dari nol.",
});

test("courses.create: anon NOT_AUTHENTICATED, member NOT_AUTHORIZED, instructor creates a DRAFT", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);

  await expect(
    t.mutation(api.features.courses.courses.create, createArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.courses.courses.create, createArgs(fx.tenantId))
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const courseId = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.courses.create, createArgs(fx.tenantId));
  const course = await t.run(async (ctx) => ctx.db.get(courseId));
  expect(course?.status).toBe("draft");
  expect(course?.createdBy).toBe(fx.instructorId);
});

test("courses.create: duplicate slug in the same tenant and invalid slug are VALIDATION_FAILED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.courses.courses.create, createArgs(fx.tenantId));
  await expect(
    asInstructor.mutation(api.features.courses.courses.create, createArgs(fx.tenantId))
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    asInstructor.mutation(api.features.courses.courses.create, {
      ...createArgs(fx.tenantId),
      slug: "Bukan Slug!",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("courses.setStatus: publishing an empty course fails; with a lesson it succeeds", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  const emptyCourseId = await asInstructor.mutation(
    api.features.courses.courses.create,
    createArgs(fx.tenantId)
  );
  await expect(
    asInstructor.mutation(api.features.courses.courses.setStatus, {
      courseId: emptyCourseId,
      status: "published",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  const { courseId } = await seedCourse(t, fx, "draft");
  await asInstructor.mutation(api.features.courses.courses.setStatus, {
    courseId,
    status: "published",
  });
  const course = await t.run(async (ctx) => ctx.db.get(courseId));
  expect(course?.status).toBe("published");
});

test("courses.update: member denied; instructor patches title; empty patch fails", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "draft");

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.courses.update, {
      courseId,
      title: "Judul Diubah Member",
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  await asInstructor.mutation(api.features.courses.courses.update, {
    courseId,
    title: "Judul Baru",
  });
  const course = await t.run(async (ctx) => ctx.db.get(courseId));
  expect(course?.title).toBe("Judul Baru");

  await expect(
    asInstructor.mutation(api.features.courses.courses.update, { courseId })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("modules: createModule appends order, member denied, rename works", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, moduleId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.courses.modules.createModule, { courseId, title: "Modul Member" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const secondId = await asInstructor.mutation(api.features.courses.modules.createModule, {
    courseId,
    title: "Modul 2",
  });
  const second = await t.run(async (ctx) => ctx.db.get(secondId));
  expect(second?.order).toBe(2);

  await asInstructor.mutation(api.features.courses.modules.renameModule, {
    moduleId,
    title: "Modul Satu",
  });
  const renamed = await t.run(async (ctx) => ctx.db.get(moduleId));
  expect(renamed?.title).toBe("Modul Satu");
});

test("modules.reorderModules: rejects a non-permutation, applies 1-based order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, moduleId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));
  const secondId = await asInstructor.mutation(api.features.courses.modules.createModule, {
    courseId,
    title: "Modul 2",
  });

  await expect(
    asInstructor.mutation(api.features.courses.modules.reorderModules, {
      courseId,
      orderedModuleIds: [secondId], // missing one module
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await asInstructor.mutation(api.features.courses.modules.reorderModules, {
    courseId,
    orderedModuleIds: [secondId, moduleId],
  });
  const first = await t.run(async (ctx) => ctx.db.get(secondId));
  const swapped = await t.run(async (ctx) => ctx.db.get(moduleId));
  expect(first?.order).toBe(1);
  expect(swapped?.order).toBe(2);
});

test("modules.deleteModule: refuses while lessons exist, deletes when empty", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { moduleId, lessonId } = await seedCourse(t, fx, "draft");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await expect(
    asInstructor.mutation(api.features.courses.modules.deleteModule, { moduleId })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await asInstructor.mutation(api.features.courses.lessons.deleteLesson, { lessonId });
  await asInstructor.mutation(api.features.courses.modules.deleteModule, { moduleId });
  const gone = await t.run(async (ctx) => ctx.db.get(moduleId));
  expect(gone).toBeNull();
});

test("manage queries: listForManage shows drafts to instructor, denies member and anon", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourse(t, fx, "draft");

  await expect(
    t.query(api.features.courses.manage.listForManage, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.listForManage, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const rows = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.listForManage, { tenantId: fx.tenantId });
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("draft");
});
