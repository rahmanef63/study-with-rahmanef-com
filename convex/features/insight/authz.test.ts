/// <reference types="vite/client" />
// Authz-DENIED paths for EVERY public function in the insight feature
// (AGENTS.md §5.2, P0). Four functions, four gates:
//   recordView   → member+   (membership IS the rate limit)
//   courseFunnel → instructor+
//   tenantPulse  → instructor+
//   saveProfile / myProfile → authenticated, own row only
//
// Also covers the authz-ORDER discriminator (pattern: analytics/authz.test.ts):
// an anonymous caller holding a DELETED id must be told NOT_AUTHENTICATED, never
// NOT_FOUND — otherwise the endpoint is an existence oracle.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedCourseWithLessons, seedLesson, seedTenantFixture, setup } from "./test.helpers";

const PLAN = {
  answers: [{ questionId: "modal", optionId: "gratis" }],
  level: "pemula" as const,
  pathSlugs: ["dasar-ai"],
};

test("recordView: anon NOT_AUTHENTICATED; outsider NOT_AUTHORIZED; member passes", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-gate", "published");

  await expect(
    t.mutation(api.features.insight.views.recordView, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .mutation(api.features.insight.views.recordView, { lessonId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const ok = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId });
  expect(ok.counted).toBe(true);
});

test("recordView: a member of ANOTHER tenant is rejected (cross-tenant)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const lessonId = await seedLesson(t, fx, "materi-milik-kita", "published");

  await expect(
    t
      .withIdentity(asUser(other.memberId))
      .mutation(api.features.insight.views.recordView, { lessonId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("recordView: anonymous + dangling id → NOT_AUTHENTICATED (auth before read)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-hilang", "published");
  await t.run(async (ctx) => {
    await ctx.db.delete(lessonId);
  });

  await expect(
    t.mutation(api.features.insight.views.recordView, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("courseFunnel: anon NOT_AUTHENTICATED; member/outsider NOT_AUTHORIZED; instructor+ pass", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(
    t.query(api.features.insight.funnel.courseFunnel, { courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.insight.funnel.courseFunnel, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t
      .withIdentity(asUser(fx.outsiderId))
      .query(api.features.insight.funnel.courseFunnel, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });
  expect(asInstructor.course._id).toBe(courseId);
  const asOwner = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.insight.funnel.courseFunnel, { courseId });
  expect(asOwner.course._id).toBe(courseId);
});

test("courseFunnel: instructor of ANOTHER tenant is rejected (cross-tenant)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const { courseId } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(
    t
      .withIdentity(asUser(other.instructorId))
      .query(api.features.insight.funnel.courseFunnel, { courseId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
});

test("courseFunnel: anonymous + dangling id → NOT_AUTHENTICATED (auth before read)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const c = await seedCourseWithLessons(t, fx, "published", 1, "kelas-hilang");
  await t.run(async (ctx) => {
    await ctx.db.delete(c.lessonIds[0]);
    await ctx.db.delete(c.courseId);
  });

  await expect(
    t.query(api.features.insight.funnel.courseFunnel, { courseId: c.courseId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("tenantPulse: anon NOT_AUTHENTICATED; member/outsider/cross-tenant NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");

  await expect(
    t.query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.insight.pulse.tenantPulse, {
      tenantId: fx.tenantId,
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).query(api.features.insight.pulse.tenantPulse, {
      tenantId: fx.tenantId,
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(other.instructorId)).query(api.features.insight.pulse.tenantPulse, {
      tenantId: fx.tenantId,
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const ok = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });
  expect(ok.memberCount).toBe(4);
});

test("saveProfile / myProfile: anonymous is rejected — but the QUESTIONNAIRE never calls them", async () => {
  const t = setup();
  await seedTenantFixture(t);

  await expect(
    t.mutation(api.features.insight.profiles.saveProfile, PLAN)
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(t.query(api.features.insight.profiles.myProfile, {})).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
});
