/// <reference types="vite/client" />
// getMine — the /beranda rollup. Covers the denied path (anon), the shape of
// the derived buckets, and the two rules that are easy to regress: a
// non-active community must not appear, and a course you have not started must
// not be counted as in progress.
import { expect, test } from "vitest";
import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import {
  asUser,
  seedCourseWithLessons,
  seedTenantFixture,
  setup,
  type T,
} from "./test.helpers";

async function complete(
  t: T,
  ids: { tenantId: Id<"tenants">; userId: Id<"users">; lessonId: Id<"lessons"> }
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", ids);
  });
}

test("getMine: anon is NOT_AUTHENTICATED before any read", async () => {
  const t = setup();
  await seedTenantFixture(t);
  await expect(t.query(api.features.progress.overview.getMine, {})).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
});

test("getMine: a started course lands in inProgress with a derived percent", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "published", 4);
  await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, lessonId: lessonIds[0]! });

  const out = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.progress.overview.getMine, {});

  expect(out.inProgress).toHaveLength(1);
  expect(out.inProgress[0]).toMatchObject({ total: 4, done: 1, percent: 25 });
  expect(out.notStarted).toHaveLength(0);
  expect(out.materiDone).toBe(1);
  expect(out.completedCount).toBe(0);
  expect(out.truncated).toBe(false);
});

test("getMine: an untouched course is notStarted, a finished one is neither", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);

  const before = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.progress.overview.getMine, {});
  expect(before.notStarted).toHaveLength(1);
  expect(before.inProgress).toHaveLength(0);

  for (const lessonId of lessonIds) {
    await complete(t, { tenantId: fx.tenantId, userId: fx.memberId, lessonId });
  }
  const after = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.progress.overview.getMine, {});
  // Done is done: it is neither "continue this" nor "start this".
  expect(after.inProgress).toHaveLength(0);
  expect(after.notStarted).toHaveLength(0);
  expect(after.completedCount).toBe(1);
});

test("getMine: a suspended community disappears from the home screen", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedCourseWithLessons(t, fx, "published", 2);

  const before = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.progress.overview.getMine, {});
  expect(before.communities).toHaveLength(1);

  await t.run(async (ctx) => {
    await ctx.db.patch(fx.tenantId, { status: "suspended" });
  });

  const after = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.progress.overview.getMine, {});
  // Not merely hidden from the list — its courses must not be counted either,
  // or the stats would advertise progress in a place you cannot open.
  expect(after.communities).toHaveLength(0);
  expect(after.notStarted).toHaveLength(0);
});
