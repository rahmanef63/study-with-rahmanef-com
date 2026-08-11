/// <reference types="vite/client" />
// tenantPulse — six numbers and two lists. The one that earns its keep is
// `leastRead`: it has to name materi that have NO roll-up row at all.
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import { dayKey } from "./day";
import {
  asUser,
  insertCompletion,
  insertRawView,
  seedLesson,
  seedTenantFixture,
  setup,
} from "./test.helpers";

afterEach(() => {
  vi.useRealTimers();
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => dayKey(Date.now() - n * MS_PER_DAY);

test("a brand-new community: real zeros, not a crash", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.memberCount).toBe(4);
  expect(pulse.activeThisWeek).toBe(0);
  expect(pulse.completionsTotal).toBe(0);
  expect(pulse.materiCount).toBe(0);
  expect(pulse.mostRead).toEqual([]);
  expect(pulse.leastRead).toEqual([]);
});

test("leastRead names materi with ZERO views — the ones with no roll-up row", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const read = await seedLesson(t, fx, "materi-dibaca", "published");
  const never = await seedLesson(t, fx, "materi-sepi", "published");
  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId: read });

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.materiCount).toBe(2);
  expect(pulse.neverReadCount).toBe(1);
  expect(pulse.leastRead[0].lessonId).toBe(never);
  expect(pulse.leastRead[0].viewedCount).toBe(0);
  expect(pulse.mostRead[0].lessonId).toBe(read);
  expect(pulse.mostRead[0].viewedCount).toBe(1);
});

test("ranking is by DISTINCT readers, and ties break on title (deterministic)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const popular = await seedLesson(t, fx, "b-populer", "published");
  const reread = await seedLesson(t, fx, "a-diulang", "published");
  const alsoZero = await seedLesson(t, fx, "c-sepi", "published");

  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId: popular });
  await t
    .withIdentity(asUser(fx.member2Id))
    .mutation(api.features.insight.views.recordView, { lessonId: popular });
  // One person, three days on the other materi: more views, fewer readers.
  await t.run(async (ctx) => {
    for (const day of ["2026-08-09", "2026-08-10", "2026-08-11"]) {
      await ctx.db.insert("materiViews", {
        tenantId: fx.tenantId,
        lessonId: reread,
        userId: fx.memberId,
        day,
      });
    }
    await ctx.db.insert("materiViewCounts", {
      tenantId: fx.tenantId,
      lessonId: reread,
      views: 3,
      viewers: 1,
      lastViewedAt: Date.now(),
    });
  });

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.mostRead.map((m) => m.lessonId)).toEqual([popular, reread, alsoZero]);
  expect(pulse.mostRead[1].viewCount).toBe(3);
  expect(pulse.mostRead[1].viewedCount).toBe(1);
});

test("drafts are excluded from both lists and from materiCount", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await seedLesson(t, fx, "materi-terbit", "published");
  await seedLesson(t, fx, "materi-draft", "draft");
  await seedLesson(t, fx, "materi-legacy"); // no status = published

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.materiCount).toBe(2);
  expect(pulse.mostRead.map((m) => m.slug)).not.toContain("materi-draft");
});

test("activeThisWeek counts PEOPLE inside the 7-day window, and drops older days", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedLesson(t, fx, "materi-a", "published");
  const b = await seedLesson(t, fx, "materi-b", "published");

  await insertRawView(t, fx, a, fx.memberId, daysAgo(0));
  await insertRawView(t, fx, b, fx.memberId, daysAgo(2)); // same person again
  await insertRawView(t, fx, a, fx.member2Id, daysAgo(6)); // edge of the window
  await insertRawView(t, fx, a, fx.ownerId, daysAgo(9)); // outside it

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.activeThisWeek).toBe(2);
});

test("completions: all-time total vs this week, scoped to THIS tenant", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const mine = await seedLesson(t, fx, "materi-milik", "published");
  const theirs = await seedLesson(t, other, "materi-lain", "published");

  await insertCompletion(t, fx, fx.memberId, mine);
  await insertCompletion(t, fx, fx.member2Id, mine);
  // The same person also learns elsewhere — must not inflate this community.
  await t.run(async (ctx) => {
    await ctx.db.insert("memberships", {
      tenantId: other.tenantId,
      userId: fx.memberId,
      role: "member",
    });
    await ctx.db.insert("lessonCompletions", {
      tenantId: other.tenantId,
      userId: fx.memberId,
      lessonId: theirs,
    });
  });

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.completionsTotal).toBe(2);
  expect(pulse.completionsThisWeek).toBe(2); // just inserted
});

test("another tenant's views and materi never appear in this pulse", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  await seedLesson(t, fx, "materi-kita", "published");
  const theirs = await seedLesson(t, other, "materi-mereka", "published");
  await t
    .withIdentity(asUser(other.memberId))
    .mutation(api.features.insight.views.recordView, { lessonId: theirs });

  const pulse = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.materiCount).toBe(1);
  expect(pulse.activeThisWeek).toBe(0);
  expect(pulse.mostRead[0].slug).toBe("materi-kita");
  expect(pulse.mostRead[0].viewedCount).toBe(0);
});

test("both lists are capped at PULSE_TOP_N", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let i = 0; i < 9; i++) {
    await seedLesson(t, fx, `materi-${i}`, "published");
  }

  const pulse = await t
    .withIdentity(asUser(fx.ownerId))
    .query(api.features.insight.pulse.tenantPulse, { tenantId: fx.tenantId });

  expect(pulse.materiCount).toBe(9);
  expect(pulse.mostRead).toHaveLength(5);
  expect(pulse.leastRead).toHaveLength(5);
});
