/// <reference types="vite/client" />
// Authz-denied paths for EVERY analytics function (DoD §5.2, P0; assignment
// #17: "a member calling any analytics fn gets NOT_AUTHORIZED — tested").
// Includes the authz-ORDER discriminator (dangling id, pattern courses/
// authz-order.test.ts): anonymous + deleted id must reject NOT_AUTHENTICATED,
// never NOT_FOUND (no existence oracle).
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourseWithLessons, seedTenantFixture, setup } from "./test.helpers";

test("getCourseAnalytics: anon NOT_AUTHENTICATED; member/outsider NOT_AUTHORIZED; instructor+ pass", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(
    t.query(api.features.analytics.queries.getCourseAnalytics, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.analytics.queries.getCourseAnalytics, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.analytics.queries.getCourseAnalytics, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.analytics.queries.getCourseAnalytics, { courseId });
  expect(asInstructor.course._id).toBe(courseId);
  const asOwner = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.analytics.queries.getCourseAnalytics, { courseId });
  expect(asOwner.course._id).toBe(courseId);
});

test("getCourseAnalytics: anonymous + dangling id → NOT_AUTHENTICATED (auth before read)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourseWithLessons(t, fx, "published", 1, "kelas-dangling");
  await t.run(async (ctx) => {
    await ctx.db.delete(c.lessonIds[0]);
    await ctx.db.delete(c.moduleId);
    await ctx.db.delete(c.courseId);
  });
  await expect(
    t.query(api.features.analytics.queries.getCourseAnalytics, { courseId: c.courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("getCourseAnalytics: instructor of ANOTHER tenant is rejected (cross-tenant)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(
    t
      .withIdentity(asUser(other.instructorId))
      .query(api.features.analytics.queries.getCourseAnalytics, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("listCourseSummaries: anon NOT_AUTHENTICATED; member/outsider/cross-tenant NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");

  await expect(
    t.query(api.features.analytics.queries.listCourseSummaries, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.analytics.queries.listCourseSummaries, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.analytics.queries.listCourseSummaries, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t
      .withIdentity(asUser(other.instructorId))
      .query(api.features.analytics.queries.listCourseSummaries, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});
