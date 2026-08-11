/// <reference types="vite/client" />
// recordView — the only write surface. What matters: it is idempotent per day,
// the roll-up can never drift from the rows it summarises, and `viewers` counts
// PEOPLE while `views` counts member-days.
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { dayKey } from "./day";
import {
  asUser,
  countViewRows,
  readTally,
  seedLesson,
  seedTenantFixture,
  setup,
} from "./test.helpers";

afterEach(() => {
  vi.useRealTimers();
});

/** Freeze the clock so day rollover is a decision, not a race. */
function freeze(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

test("first view: inserts one row and creates the roll-up at 1/1", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-satu", "published");

  const result = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId });

  expect(result.counted).toBe(true);
  expect(result.day).toBe(dayKey(Date.now()));
  expect(await countViewRows(t, lessonId)).toBe(1);
  const tally = await readTally(t, fx, lessonId);
  expect(tally).not.toBeNull();
  expect(tally?.views).toBe(1);
  expect(tally?.viewers).toBe(1);
  expect(tally?.lastViewedAt).toBeGreaterThan(0);
});

test("same member, same day, ten calls: still 1 row and 1 view (unspammable)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-spam", "published");
  const as = t.withIdentity(asUser(fx.memberId));

  const results = [];
  for (let i = 0; i < 10; i++) {
    results.push(await as.mutation(api.features.insight.views.recordView, { lessonId }));
  }

  expect(results[0].counted).toBe(true);
  expect(results.slice(1).every((r) => r.counted === false)).toBe(true);
  expect(await countViewRows(t, lessonId)).toBe(1);
  const tally = await readTally(t, fx, lessonId);
  expect(tally?.views).toBe(1);
  expect(tally?.viewers).toBe(1);
});

test("a repeat call does not even touch lastViewedAt", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-noop", "published");
  const as = t.withIdentity(asUser(fx.memberId));

  freeze("2026-08-11T02:00:00Z");
  await as.mutation(api.features.insight.views.recordView, { lessonId });
  const first = await readTally(t, fx, lessonId);

  vi.setSystemTime(new Date("2026-08-11T09:00:00Z")); // later, SAME WIB day
  await as.mutation(api.features.insight.views.recordView, { lessonId });
  const second = await readTally(t, fx, lessonId);

  expect(second?.lastViewedAt).toBe(first?.lastViewedAt);
});

test("same member, next day: views goes up, viewers does NOT", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-lintas-hari", "published");
  const as = t.withIdentity(asUser(fx.memberId));

  freeze("2026-08-11T02:00:00Z");
  await as.mutation(api.features.insight.views.recordView, { lessonId });
  vi.setSystemTime(new Date("2026-08-12T02:00:00Z"));
  const second = await as.mutation(api.features.insight.views.recordView, { lessonId });

  expect(second.counted).toBe(true);
  expect(second.day).toBe("2026-08-12");
  expect(await countViewRows(t, lessonId)).toBe(2);
  const tally = await readTally(t, fx, lessonId);
  expect(tally?.views).toBe(2); // member-days
  expect(tally?.viewers).toBe(1); // still one person
});

test("the WIB rollover, not the UTC one, opens the next day's window", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-rollover", "published");
  const as = t.withIdentity(asUser(fx.memberId));

  freeze("2026-08-11T16:00:00Z"); // 23:00 WIB, 11 Aug
  const before = await as.mutation(api.features.insight.views.recordView, { lessonId });
  vi.setSystemTime(new Date("2026-08-11T17:30:00Z")); // 00:30 WIB, 12 Aug
  const after = await as.mutation(api.features.insight.views.recordView, { lessonId });

  expect(before.day).toBe("2026-08-11");
  expect(after.day).toBe("2026-08-12");
  expect(after.counted).toBe(true);
});

test("a second member: both counts go up", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-dua-orang", "published");

  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId });
  await t
    .withIdentity(asUser(fx.member2Id))
    .mutation(api.features.insight.views.recordView, { lessonId });

  const tally = await readTally(t, fx, lessonId);
  expect(tally?.views).toBe(2);
  expect(tally?.viewers).toBe(2);
});

test("a materi with no `status` counts as published and is recordable", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-legacy"); // status undefined

  const result = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId });
  expect(result.counted).toBe(true);
});

test("draft materi: member gets NOT_FOUND (no existence leak); instructor is counted", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-draft", "draft");

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.insight.views.recordView, { lessonId })
  ).rejects.toThrow(/NOT_FOUND/);
  expect(await readTally(t, fx, lessonId)).toBeNull();

  const asInstructor = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.insight.views.recordView, { lessonId });
  expect(asInstructor.counted).toBe(true);
});

test("history and roll-up agree after an interleaved multi-day, multi-member run", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedLesson(t, fx, "materi-campur", "published");
  const one = t.withIdentity(asUser(fx.memberId));
  const two = t.withIdentity(asUser(fx.member2Id));

  freeze("2026-08-11T02:00:00Z");
  await one.mutation(api.features.insight.views.recordView, { lessonId });
  await one.mutation(api.features.insight.views.recordView, { lessonId }); // dup
  await two.mutation(api.features.insight.views.recordView, { lessonId });
  vi.setSystemTime(new Date("2026-08-12T02:00:00Z"));
  await one.mutation(api.features.insight.views.recordView, { lessonId });
  vi.setSystemTime(new Date("2026-08-13T02:00:00Z"));
  await one.mutation(api.features.insight.views.recordView, { lessonId });
  await two.mutation(api.features.insight.views.recordView, { lessonId });

  const rows = await countViewRows(t, lessonId);
  const tally = await readTally(t, fx, lessonId);
  expect(rows).toBe(5); // 3 days × member1, 2 days × member2, dup dropped
  expect(tally?.views).toBe(rows); // roll-up NEVER drifts from history
  expect(tally?.viewers).toBe(2);
});
