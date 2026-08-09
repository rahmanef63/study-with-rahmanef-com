/// <reference types="vite/client" />
// posts — the Discord + inbox fan-out path for `kind: "pengumuman"` (v1.8 #33).
// MOVED from announcements/discord.test.ts: creating a pengumuman SCHEDULES the
// internal action; a successful POST hits the webhook; a failing POST leaves the
// post saved and never logs the URL; a tenant with no webhook is a silent no-op;
// a plain `diskusi` post never touches Discord at all. fetch is stubbed; the
// scheduled action runs via convex-test's finishInProgressScheduledFunctions().
import { afterEach, expect, test, vi } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  seedTenantFixture,
  setup,
  TEST_WEBHOOK_URL,
  type T,
  type TenantFixture,
} from "./test.helpers";

const createFn = api.features.posts.posts.create;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/**
 * Run the functions scheduled via ctx.scheduler.runAfter(0, ...). convex-test
 * dispatches them through a real setTimeout, so we must yield to the macrotask
 * queue for the timer to fire BEFORE finishInProgressScheduledFunctions can
 * await it. Loop to cover chained scheduling and timer jitter.
 */
async function flushScheduled(t: T) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

async function announce(
  t: T,
  fx: TenantFixture,
  title: string,
  kind: "pengumuman" | "diskusi" = "pengumuman"
): Promise<Id<"posts">> {
  return await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createFn, { tenantId: fx.tenantId, kind, title, bodyMd: "Isi pengumuman." });
}

test("a pengumuman POSTs to the webhook after the scheduled action runs", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, "komunitas-test", "active", { withWebhook: true });
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  const postId = await announce(t, fx, "Rilis v1.8");
  expect(fetchMock).not.toHaveBeenCalled(); // fire-and-forget, not inline

  await flushScheduled(t);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(calledUrl).toBe(TEST_WEBHOOK_URL);
  expect(init.method).toBe("POST");
  expect(String(init.body)).toContain("Rilis v1.8");
  // The post itself is untouched by the Discord round trip.
  expect(await t.run((ctx) => ctx.db.get(postId))).not.toBeNull();
});

test("a plain diskusi post NEVER reaches Discord (kind gate)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, "komunitas-test", "active", { withWebhook: true });
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  await announce(t, fx, "Tanya soal prompt", "diskusi");
  await flushScheduled(t);

  expect(fetchMock).not.toHaveBeenCalled();
});

test("a thrown fetch failure leaves the post saved and never logs the URL (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, "komunitas-test", "active", { withWebhook: true });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error(`network down ${TEST_WEBHOOK_URL}`);
    })
  );
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const postId = await announce(t, fx, "Gagal kirim");
  await flushScheduled(t);

  expect(await t.run((ctx) => ctx.db.get(postId))).not.toBeNull();
  expect(errorSpy).toHaveBeenCalled();
  for (const call of errorSpy.mock.calls) {
    expect(JSON.stringify(call)).not.toContain(TEST_WEBHOOK_URL);
  }
});

test("a non-2xx Discord response is logged as a status only, post intact", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, "komunitas-test", "active", { withWebhook: true });
  vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const postId = await announce(t, fx, "Webhook mati");
  await flushScheduled(t);

  expect(await t.run((ctx) => ctx.db.get(postId))).not.toBeNull();
  expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(TEST_WEBHOOK_URL);
});

test("a tenant with no webhook is a silent no-op (no fetch, post saved)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  const postId = await announce(t, fx, "Tanpa webhook");
  await flushScheduled(t);

  expect(fetchMock).not.toHaveBeenCalled();
  expect(await t.run((ctx) => ctx.db.get(postId))).not.toBeNull();
});

test("the create result never carries the webhook URL (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, "komunitas-test", "active", { withWebhook: true });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

  const result = await announce(t, fx, "Aman");

  expect(JSON.stringify(result)).not.toContain(TEST_WEBHOOK_URL);
});

test("a pengumuman fans out to every member EXCEPT the sender (P0 no self-notify)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

  await announce(t, fx, "Kelas baru dibuka");
  await flushScheduled(t);

  const rows = await t.run(async (ctx) => ctx.db.query("notifications").collect());
  expect(rows).toHaveLength(2); // owner + member; instructor is the sender
  expect(rows.every((n) => n.kind === "announcement")).toBe(true);
  expect(rows.some((n) => n.userId === fx.instructorId)).toBe(false);
  expect(rows.every((n) => n.href?.startsWith("/k/komunitas-test/post/"))).toBe(true);
});
