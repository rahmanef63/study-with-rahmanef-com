/// <reference types="vite/client" />
// markLessonComplete — the P0 paths from docs/AGENT-PROMPTS.md epsilon:
// authz-denied (anon + non-member), idempotency (materi + badge), userId from
// ctx (never args), badge creation — plus the materi-model invariants
// (DECISIONS #36/#37): the completion key carries NO courseId, one call settles
// every course the materi is placed in, and the MATERI's status is the gate.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  placeLesson,
  seedCourseWithLessons,
  seedMateri,
  seedTenantFixture,
  setup,
} from "./test.helpers";

const fn = api.features.progress.mutations.markLessonComplete;

test("markLessonComplete: anon is NOT_AUTHENTICATED, non-member is NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonIds } = await seedCourseWithLessons(t, fx, "published", 1);

  await expect(t.mutation(fn, { lessonId: lessonIds[0] })).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).mutation(fn, { lessonId: lessonIds[0] })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(0);
  });
});

test("markLessonComplete: records the caller's own completion and is idempotent", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  const first = await asMember.mutation(fn, { lessonId: lessonIds[0] });
  expect(first).toMatchObject({ wasAlreadyComplete: false, courseCompleted: false });
  expect(first.courses).toEqual([
    { courseId, completedCount: 1, totalCount: 2, isComplete: false },
  ]);

  // userId is resolved from ctx (the args validator has no userId field): the
  // stored row belongs to the authenticated member, and is scoped by tenant.
  await t.run(async (ctx) => {
    const rows = await ctx.db.query("lessonCompletions").collect();
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(fx.memberId);
    expect(rows[0].tenantId).toBe(fx.tenantId);
    // courseId is PROVENANCE — recorded because there is exactly one placement.
    expect(rows[0].courseId).toBe(courseId);
  });

  const again = await asMember.mutation(fn, { lessonId: lessonIds[0] });
  expect(again.wasAlreadyComplete).toBe(true);
  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(1);
  });
});

test("markLessonComplete: finishing the last materi creates courseCompletion once (idempotent badge)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "published", 2);
  const asMember = t.withIdentity(asUser(fx.memberId));

  await asMember.mutation(fn, { lessonId: lessonIds[0] });
  const last = await asMember.mutation(fn, { lessonId: lessonIds[1] });
  expect(last.courseCompleted).toBe(true);
  expect(last.courses[0]).toMatchObject({ completedCount: 2, totalCount: 2, isComplete: true });

  await t.run(async (ctx) => {
    const completions = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user_course", (q) => q.eq("userId", fx.memberId).eq("courseId", courseId))
      .collect();
    expect(completions).toHaveLength(1);
    expect(completions[0].tenantId).toBe(fx.tenantId);
  });

  // Re-marking an already-complete materi must not mint a second badge.
  await asMember.mutation(fn, { lessonId: lessonIds[1] });
  await t.run(async (ctx) => {
    expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(1);
  });
});

test("markLessonComplete: one materi in TWO courses is finished ONCE and counts in both", async () => {
  // THE BUG THIS PREVENTS: with courseId in the completion key, someone who
  // finished "sub agents" in Claude Code would be asked to finish it again in
  // Hermes, and their progress would be double-counted.
  const t = setup();
  const fx = await seedTenantFixture(t);
  const claude = await seedCourseWithLessons(t, fx, "published", 1, "claude-code");
  const hermes = await seedCourseWithLessons(t, fx, "published", 1, "hermes");
  const shared = await seedMateri(t, fx, { slug: "sub-agents" });
  await placeLesson(t, fx, claude.courseId, shared, 2);
  await placeLesson(t, fx, hermes.courseId, shared, 2);

  const asMember = t.withIdentity(asUser(fx.memberId));
  const result = await asMember.mutation(fn, { lessonId: shared });

  // ONE row, no courseId (two placements → no honest provenance).
  await t.run(async (ctx) => {
    const rows = await ctx.db.query("lessonCompletions").collect();
    expect(rows).toHaveLength(1);
    expect(rows[0].courseId).toBeUndefined();
  });
  // …but it counts toward BOTH courses.
  expect(result.courses).toHaveLength(2);
  for (const course of result.courses) {
    expect(course).toMatchObject({ completedCount: 1, totalCount: 2, isComplete: false });
  }

  // Finishing each course's own materi now completes both at once.
  await asMember.mutation(fn, { lessonId: claude.lessonIds[0] });
  await asMember.mutation(fn, { lessonId: hermes.lessonIds[0] });
  await t.run(async (ctx) => {
    const badges = await ctx.db.query("courseCompletions").collect();
    expect(badges.map((b) => b.courseId).sort()).toEqual(
      [claude.courseId, hermes.courseId].sort()
    );
  });
});

test("markLessonComplete: a DRAFT materi is NOT_FOUND for a member, completable by instructor+", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const draft = await seedMateri(t, fx, { slug: "draf", status: "draft" });

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(fn, { lessonId: draft })
  ).rejects.toThrow(/NOT_FOUND/);
  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(0);
  });

  const preview = await t.withIdentity(asUser(fx.instructorId)).mutation(fn, { lessonId: draft });
  expect(preview.wasAlreadyComplete).toBe(false);
});

test("markLessonComplete: a DRAFT course does not hide its materi, but mints no badge", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonIds } = await seedCourseWithLessons(t, fx, "draft", 1);

  const result = await t.withIdentity(asUser(fx.memberId)).mutation(fn, { lessonId: lessonIds[0] });
  expect(result.courses).toEqual([{ courseId, completedCount: 1, totalCount: 1, isComplete: true }]);

  await t.run(async (ctx) => {
    expect(await ctx.db.query("lessonCompletions").collect()).toHaveLength(1);
    // No phantom badge before publish — the BADGE is still course-level.
    expect(await ctx.db.query("courseCompletions").collect()).toHaveLength(0);
  });
});
