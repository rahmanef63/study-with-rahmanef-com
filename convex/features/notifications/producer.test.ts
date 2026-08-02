/// <reference types="vite/client" />
// Producer #1 specs (#21): comments.addComment reply → comment_reply
// notification for the PARENT author. Lives in the notifications feature (it
// asserts THIS feature's producer contract); drives the comments mutation via
// its public api path. Scheduled functions flush via convex-test's
// finishInProgressScheduledFunctions (pattern: announcements/discord.test.ts).
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  asUser,
  readUserNotifications,
  seedLesson,
  seedTenantFixture,
  setup,
  type T,
} from "./test.helpers";

/**
 * Run the functions scheduled via ctx.scheduler.runAfter(0, ...). convex-test
 * dispatches them through a real setTimeout, so yield to the macrotask queue
 * before finishInProgressScheduledFunctions can await them (loop covers
 * chained scheduling + timer jitter).
 */
async function flushScheduled(t: T) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lf = await seedLesson(t, fx);
  await t.run(async (ctx) => {
    await ctx.db.insert("profiles", {
      userId: fx.instructorId,
      username: "guru",
      displayName: "Bu Guru",
    });
  });
  const rootId: Id<"comments"> = await t.withIdentity(asUser(fx.memberId))
    .mutation(api.features.comments.comments.addComment, {
      lessonId: lf.lessonId,
      bodyMd: "Komentar utama",
    });
  return { t, fx, ...lf, rootId };
}

describe("comment_reply producer (comments.addComment)", () => {
  test("reply by ANOTHER user notifies the parent author with a lesson deep-link", async () => {
    const { t, fx, lessonId, rootId } = await fixture();
    await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, {
        lessonId,
        bodyMd: "Balasan guru",
        parentId: rootId,
      });
    await flushScheduled(t);

    const rows = await readUserNotifications(t, fx.memberId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("comment_reply");
    expect(rows[0]?.tenantId).toBe(fx.tenantId);
    expect(rows[0]?.readAt).toBeUndefined(); // born unread
    expect(rows[0]?.href).toBe(`/kelas/komunitas-test/kelas-published/lesson/${lessonId}`);
    // Copy is Bahasa Indonesia; only the replier's displayName as PII.
    expect(rows[0]?.title).toBe("Balasan baru di diskusimu");
    expect(rows[0]?.body).toContain("Bu Guru");
    expect(rows[0]?.body).not.toContain("guru@"); // never the email
  });

  test("SELF-reply never notifies (P0 #21)", async () => {
    const { t, fx, lessonId, rootId } = await fixture();
    await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.addComment, {
        lessonId,
        bodyMd: "Balas diri sendiri",
        parentId: rootId,
      });
    await flushScheduled(t);
    expect(await readUserNotifications(t, fx.memberId)).toHaveLength(0);
  });

  test("ROOT comment (no parentId) never notifies", async () => {
    const { t, fx, lessonId } = await fixture();
    await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, {
        lessonId,
        bodyMd: "Komentar utama lain",
      });
    await flushScheduled(t);
    expect(await readUserNotifications(t, fx.memberId)).toHaveLength(0);
    expect(await readUserNotifications(t, fx.instructorId)).toHaveLength(0);
  });

  test("replier without a profile falls back to anonymous copy (no email leak)", async () => {
    const { t, fx, lessonId, rootId } = await fixture();
    // Owner has no profile row in this fixture.
    await t.withIdentity(asUser(fx.ownerId))
      .mutation(api.features.comments.comments.addComment, {
        lessonId,
        bodyMd: "Balasan owner",
        parentId: rootId,
      });
    await flushScheduled(t);
    const rows = await readUserNotifications(t, fx.memberId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.body).toContain("Seseorang");
    expect(rows[0]?.body).not.toContain("owner@");
  });

  test("comment write still succeeds and reply lands even while the notification is pending", async () => {
    const { t, fx, lessonId, rootId } = await fixture();
    // AnyApi _generated returns `any` — pin the id so ctx.db.get narrows.
    const replyId: Id<"comments"> = await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, {
        lessonId,
        bodyMd: "Fire-and-forget",
        parentId: rootId,
      });
    // BEFORE flushing: the reply row exists; the notification does not yet.
    expect(await t.run((ctx) => ctx.db.get(replyId))).not.toBeNull();
    expect(await readUserNotifications(t, fx.memberId)).toHaveLength(0);
    await flushScheduled(t);
    expect(await readUserNotifications(t, fx.memberId)).toHaveLength(1);
  });
});
