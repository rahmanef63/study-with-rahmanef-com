/// <reference types="vite/client" />
// resources feature — notification producer specs (#22, wave v1.3). Asserts:
// (1) curate + setStatus create ONE notification row for the SUBMITTER with the
// right kind / Bahasa Indonesia title / deep-link href; (2) P0: the actor is
// NEVER notified about their own action; (3) an idempotent status re-set does
// not notify; (4) the authz-denied paths are unchanged AND produce no rows.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import {
  asUser,
  flushScheduled,
  listNotifications,
  seedResource,
  seedSuggestion,
  seedTenantFixture,
  setup,
} from "./test.helpers";

// ── curate → resource_reviewed ──────────────────────────────────────────────

test("curate approve: submitter gets ONE unread resource_reviewed notification with deep-link", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedResource(t, fx, "pending", fx.memberId, "Panduan RAG");

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.resources.curate, { resourceId: id, decision: "approved" });
  await flushScheduled(t);

  const rows = await listNotifications(t);
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(fx.memberId); // recipient = submitter, not actor
  expect(rows[0].tenantId).toBe(fx.tenantId);
  expect(rows[0].kind).toBe("resource_reviewed");
  expect(rows[0].title).toBe("Sumbermu disetujui");
  expect(rows[0].body).toContain("Panduan RAG");
  expect(rows[0].href).toBe("/resources/komunitas-test"); // fixture tenant slug
  expect(rows[0].readAt).toBeUndefined(); // lands unread
});

test("curate reject: title flips to 'Sumbermu ditolak'", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedResource(t, fx, "pending", fx.memberId);

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.resources.curate, { resourceId: id, decision: "rejected" });
  await flushScheduled(t);

  const rows = await listNotifications(t);
  expect(rows).toHaveLength(1);
  expect(rows[0].title).toBe("Sumbermu ditolak");
  expect(rows[0].kind).toBe("resource_reviewed");
});

test("curate P0: actor curating their OWN submission → decision applied, NO notification", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  // Instructor submitted the resource themselves, then curates it.
  const id = await seedResource(t, fx, "pending", fx.instructorId, "Punya kurator");

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.resources.curate, { resourceId: id, decision: "approved" });
  await flushScheduled(t);

  const row = await t.run((ctx) => ctx.db.get(id));
  expect(row?.status).toBe("approved"); // the curation itself still lands
  expect(await listNotifications(t)).toHaveLength(0); // never notify self (P0)
});

// ── setStatus → suggestion_status ───────────────────────────────────────────

test("setStatus: submitter gets ONE suggestion_status notification with ID copy + deep-link", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedSuggestion(t, fx, "open", fx.memberId, "Kelas Prompting");

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.suggestions.setStatus, {
      suggestionId: id,
      status: "planned",
    });
  await flushScheduled(t);

  const rows = await listNotifications(t);
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(fx.memberId);
  expect(rows[0].kind).toBe("suggestion_status");
  expect(rows[0].title).toBe("Status usulanmu diperbarui");
  expect(rows[0].body).toContain("Kelas Prompting");
  expect(rows[0].body).toContain("direncanakan");
  expect(rows[0].href).toBe("/resources/komunitas-test");
});

test("setStatus P0: actor triaging their OWN suggestion → status applied, NO notification", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedSuggestion(t, fx, "open", fx.instructorId, "Usulan kurator");

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.resources.suggestions.setStatus, { suggestionId: id, status: "done" });
  await flushScheduled(t);

  const row = await t.run((ctx) => ctx.db.get(id));
  expect(row?.status).toBe("done");
  expect(await listNotifications(t)).toHaveLength(0);
});

test("setStatus: re-setting the SAME status is idempotent — no duplicate notification", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const id = await seedSuggestion(t, fx, "open", fx.memberId);

  const triage = () =>
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.resources.suggestions.setStatus, {
        suggestionId: id,
        status: "planned",
      });
  await triage();
  await triage(); // same status again → no-op change
  await flushScheduled(t);

  expect(await listNotifications(t)).toHaveLength(1); // only the real change notified
});

// ── authz-denied paths unchanged + produce no rows (DoD §5.2) ────────────────

test("denied paths: anonymous & wrong-role callers rejected as before, ZERO notifications", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const resourceId = await seedResource(t, fx, "pending", fx.memberId);
  const suggestionId = await seedSuggestion(t, fx, "open", fx.memberId);

  await expect(
    t.mutation(api.features.resources.resources.curate, { resourceId, decision: "approved" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.resources.resources.curate, { resourceId, decision: "approved" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.mutation(api.features.resources.suggestions.setStatus, { suggestionId, status: "done" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t
      .withIdentity(asUser(fx.member2Id))
      .mutation(api.features.resources.suggestions.setStatus, { suggestionId, status: "done" })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await flushScheduled(t);
  expect(await listNotifications(t)).toHaveLength(0);
});
