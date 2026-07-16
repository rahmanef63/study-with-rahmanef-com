/// <reference types="vite/client" />
// Announcement fan-out producer specs (#28, wave v1.4). Asserts:
// (1) create → every OTHER member gets ONE unread "announcement" notification
// with the announcement title + /pengumuman/<tenantSlug> deep-link;
// (2) P0: the sender NEVER notifies themself; (3) the memberships fan-out is
// bounded at take(200) — members beyond the bound get nothing; (4) the
// authz-denied create paths are unchanged AND produce zero rows; (5) the
// announcement write itself lands even before the scheduled fan-out runs
// (fire-and-forget). flushScheduled pattern: notifications/producer.test.ts.
import { expect, test } from "vitest";
import type { Doc, Id } from "../../_generated/dataModel";
import { MEMBER_FANOUT_TAKE } from "./notify";
import { asUser, createRef, seedTenantFixture, setup, type T } from "./test.helpers";

/**
 * Run the functions scheduled via ctx.scheduler.runAfter(0, ...). convex-test
 * dispatches them through a real setTimeout, so yield to the macrotask queue
 * before finishInProgressScheduledFunctions can await them.
 */
async function flushScheduled(t: T) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

/** All notification rows for a user (test-side read, bypasses queries). */
async function readUserNotifications(t: T, userId: Id<"users">): Promise<Doc<"notifications">[]> {
  return await t.run(async (ctx) =>
    ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  );
}

/** Total notification rows in the table (bounded fixture data — test-only). */
async function countAllNotifications(t: T): Promise<number> {
  return await t.run(async (ctx) => (await ctx.db.query("notifications").collect()).length);
}

test("create: every other member is notified (kind announcement, deep-link, unread); sender is NOT (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);

  await t.withIdentity(asUser(fx.instructorId)).mutation(createRef, {
    tenantId: fx.tenantId,
    title: "Kelas baru dibuka!",
    bodyMd: "Materi RAG mulai pekan depan.",
  });
  await flushScheduled(t);

  for (const userId of [fx.ownerId, fx.memberId]) {
    const rows = await readUserNotifications(t, userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("announcement");
    expect(rows[0]?.tenantId).toBe(fx.tenantId);
    expect(rows[0]?.title).toBe("Kelas baru dibuka!"); // = announcement title
    expect(rows[0]?.href).toBe("/pengumuman/komunitas-test"); // fixture tenant slug
    expect(rows[0]?.readAt).toBeUndefined(); // born unread
  }
  // P0: the sender never notifies themself.
  expect(await readUserNotifications(t, fx.instructorId)).toHaveLength(0);
  // Non-member gets nothing.
  expect(await readUserNotifications(t, fx.outsiderId)).toHaveLength(0);
});

test("announcement write lands even before the scheduled fan-out runs (fire-and-forget)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const r = await t.withIdentity(asUser(fx.ownerId)).mutation(createRef, {
    tenantId: fx.tenantId,
    title: "Dari owner",
    bodyMd: "Isi.",
  });
  // BEFORE flushing: the announcement row exists; notifications do not yet.
  expect(await t.run((ctx) => ctx.db.get(r.announcementId as Id<"announcements">))).not.toBeNull();
  expect(await countAllNotifications(t)).toBe(0);
  await flushScheduled(t);
  // Owner sent it → instructor + member notified, owner not.
  expect(await countAllNotifications(t)).toBe(2);
  expect(await readUserNotifications(t, fx.ownerId)).toHaveLength(0);
});

test(`fan-out is bounded at take(${MEMBER_FANOUT_TAKE}): members beyond the bound get nothing`, async () => {
  const t = setup();
  const fx = await seedTenantFixture(t); // seeds 3 memberships first
  const EXTRA = MEMBER_FANOUT_TAKE + 2; // total memberships = 205 > bound
  const extraIds = await t.run(async (ctx) => {
    const ids: Id<"users">[] = [];
    for (let i = 0; i < EXTRA; i++) {
      const userId = await ctx.db.insert("users", { email: `anggota-${i}@test.id` });
      await ctx.db.insert("memberships", { tenantId: fx.tenantId, userId, role: "member" });
      ids.push(userId);
    }
    return ids;
  });

  await t.withIdentity(asUser(fx.instructorId)).mutation(createRef, {
    tenantId: fx.tenantId,
    title: "Pengumuman massal",
    bodyMd: "Isi.",
  });
  await flushScheduled(t);

  // by_tenant scans in creation order: the first 200 memberships are the 3
  // fixture rows + the first 197 extras; the sender is inside that window and
  // is excluded → exactly 199 rows, always ≤ the createMany cap.
  expect(await countAllNotifications(t)).toBe(MEMBER_FANOUT_TAKE - 1);
  expect(await readUserNotifications(t, fx.instructorId)).toHaveLength(0); // sender (P0)
  expect(await readUserNotifications(t, fx.ownerId)).toHaveLength(1);
  expect(await readUserNotifications(t, extraIds[EXTRA - 1]!)).toHaveLength(0); // beyond bound
});

test("authz-denied create paths are unchanged AND produce zero notifications", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const args = { tenantId: fx.tenantId, title: "Halo semua", bodyMd: "Isi." };

  await expect(t.mutation(createRef, args)).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(createRef, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).mutation(createRef, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await flushScheduled(t);
  expect(await countAllNotifications(t)).toBe(0);
});
