/// <reference types="vite/client" />
import { expect, test } from "vitest";
import { makeFunctionReference } from "convex/server";
import { seedCourseWithLessons, seedTenantFixture, setup } from "./test.helpers";

type BackfillResult = { continueCursor: string; isDone: boolean; scanned: number; updated: number; mismatches: number };
const fn = makeFunctionReference<"mutation", {
  cursor: string | null; dryRun?: boolean; verifyOnly?: boolean;
}, BackfillResult>(
  "features/progress/placementBackfill:run"
);

test("eligibility backfill is bounded, resumable, readonly when requested, and idempotent", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "published", 23);
  await t.run(async (ctx) => {
    await ctx.db.patch(lessonIds[0], { status: undefined });
    await ctx.db.patch(lessonIds[1], { status: "draft" });
    await ctx.db.delete(lessonIds[2]);
    const other = await ctx.db.insert("tenants", {
      slug: "foreign", name: "Foreign", description: "Foreign", ownerId: fx.ownerId, status: "active",
    });
    await ctx.db.patch(lessonIds[3], { tenantId: other });
  });
  for (const readonly of [{ dryRun: true }, { verifyOnly: true }]) {
    const check = await t.mutation(fn, { cursor: null, ...readonly });
    expect(check).toMatchObject({ scanned: 10, updated: 0, mismatches: 10, isDone: false });
  }
  let cursor: string | null = null;
  let updated = 0;
  do {
    const page: BackfillResult = await t.mutation(fn, { cursor });
    expect(page.scanned).toBeLessThanOrEqual(10);
    updated += page.updated;
    cursor = page.isDone ? null : page.continueCursor;
  } while (cursor !== null);
  expect(updated).toBe(23);
  await t.run(async (ctx) => {
    const placements = await ctx.db.query("courseLessons").withIndex("by_lesson").take(23);
    for (const row of placements) expect(row.lessonPublished).toBe(!lessonIds.slice(1, 4).includes(row.lessonId));
  });
  do {
    const page: BackfillResult = await t.mutation(fn, { cursor });
    expect(page).toMatchObject({ updated: 0, mismatches: 0 });
    cursor = page.isDone ? null : page.continueCursor;
  } while (cursor !== null);
});
