/// <reference types="vite/client" />
// Course-level mutations — authz-denied paths (P0), per-tenant slug uniqueness,
// the publish gate (now: ≥1 PLACED materi), and the retired module stubs.
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

  const courseId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.courses.create, createArgs(fx.tenantId))) as Id<"courses">;
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

test("courses.setStatus: publishing a course with no PLACED materi fails; with one it succeeds", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  const emptyCourseId = (await asInstructor.mutation(
    api.features.courses.courses.create,
    createArgs(fx.tenantId)
  )) as Id<"courses">;
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

test("manage.getCourseForManage: flat ordered materi incl. drafts; member + anon denied", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "draft");

  await expect(
    t.query(api.features.courses.manage.getCourseForManage, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.getCourseForManage, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const tree = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.getCourseForManage, { courseId });
  expect(tree.course._id).toBe(courseId);
  expect(tree).not.toHaveProperty("modules");
  expect(tree.lessons).toHaveLength(1);
  expect(tree.lessons[0]._id).toBe(lessonId);
  expect(tree.lessons[0].order).toBe(1);
  expect(tree.lessons[0].linkCount).toBe(1);
});

test("manage.listMateriForManage: tenant-wide materi picker, instructor+ only", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourse(t, fx, "published");

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.listMateriForManage, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const rows = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.listMateriForManage, { tenantId: fx.tenantId });
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe("published");
});
