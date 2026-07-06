/// <reference types="vite/client" />
// announcements — the Discord scheduler/action path (DoD §5.2 + prompt): create
// SCHEDULES the internal action; a successful POST flips postedToDiscord=true; a
// failing POST leaves the announcement saved (postedToDiscord=false); a tenant
// with no webhook is a silent no-op. fetch is stubbed; the scheduled action runs
// via convex-test's finishInProgressScheduledFunctions().
import { afterEach, expect, test, vi } from "vitest";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  createRef,
  seedTenantFixture,
  setup,
  TEST_WEBHOOK_URL,
  type T,
} from "./test.helpers";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function readAnnouncement(t: T, id: Id<"announcements">) {
  return await t.run(async (ctx) => ctx.db.get(id));
}

/**
 * Run the functions scheduled via ctx.scheduler.runAfter(0, ...). convex-test
 * dispatches them through a real setTimeout, so we must yield to the macrotask
 * queue for the timer to fire (adding the job to the in-flight set) BEFORE
 * finishInProgressScheduledFunctions can await it. Loop to cover any chained
 * scheduling and timer jitter.
 */
async function flushScheduled(t: T) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

test("create schedules the action; a 204 success flips postedToDiscord=true and POSTs to the webhook", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, { withWebhook: true });
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  const { announcementId } = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Rilis v1.1", bodyMd: "Fitur baru!" });

  expect((await readAnnouncement(t, announcementId))?.postedToDiscord).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();

  await flushScheduled(t);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(calledUrl).toBe(TEST_WEBHOOK_URL);
  expect(init.method).toBe("POST");
  expect(String(init.body)).toContain("Rilis v1.1");
  expect((await readAnnouncement(t, announcementId))?.postedToDiscord).toBe(true);
});

test("a thrown fetch failure leaves the announcement saved with postedToDiscord=false and never logs the URL (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, { withWebhook: true });
  const fetchMock = vi.fn(async () => {
    throw new Error(`network down ${TEST_WEBHOOK_URL}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const { announcementId } = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Gagal kirim", bodyMd: "Isi." });
  await flushScheduled(t);

  const saved = await readAnnouncement(t, announcementId);
  expect(saved).not.toBeNull();
  expect(saved?.postedToDiscord).toBe(false);
  expect(errorSpy).toHaveBeenCalled();
  for (const call of errorSpy.mock.calls) {
    expect(JSON.stringify(call)).not.toContain(TEST_WEBHOOK_URL);
  }
});

test("a non-2xx Discord response leaves postedToDiscord=false", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, { withWebhook: true });
  vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
  vi.spyOn(console, "error").mockImplementation(() => {});

  const { announcementId } = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Webhook mati", bodyMd: "Isi." });
  await flushScheduled(t);

  expect((await readAnnouncement(t, announcementId))?.postedToDiscord).toBe(false);
});

test("a tenant with no webhook is a silent no-op (no fetch, announcement saved)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);

  const { announcementId } = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Tanpa webhook", bodyMd: "Isi." });
  await flushScheduled(t);

  expect(fetchMock).not.toHaveBeenCalled();
  expect((await readAnnouncement(t, announcementId))?.postedToDiscord).toBe(false);
});

test("the create result never carries the webhook URL (P0)", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t, { withWebhook: true });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));

  const result = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(createRef, { tenantId: fx.tenantId, title: "Aman", bodyMd: "Isi." });

  expect(JSON.stringify(result)).not.toContain(TEST_WEBHOOK_URL);
  expect(Object.keys(result)).toEqual(["announcementId"]);
});
