/// <reference types="vite/client" />
// Authz-ORDER regression specs (pattern: courses/authz-order.test.ts; STATUS
// drift log 2026-07-06). Discriminator = a DANGLING id (seed → delete → call
// anonymously). Read-first code would resolve null → NOT_FOUND (existence
// oracle for anonymous callers); auth-first code rejects NOT_AUTHENTICATED
// before any DB read — so these FAIL on read-first and PASS on the fix.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { seedComment, seedLesson, seedTenantFixture, setup } from "./test.helpers";

async function danglingFixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lf = await seedLesson(t, fx);
  const commentId = await seedComment(t, fx, lf.lessonId, fx.memberId, "Akan digantung");
  await t.run(async (ctx) => {
    await ctx.db.delete(commentId);
    await ctx.db.delete(lf.lessonId);
    await ctx.db.delete(lf.moduleId);
    await ctx.db.delete(lf.courseId);
  });
  return { t, fx, commentId, ...lf };
}

test("addComment: anonymous + dangling lessonId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const { t, lessonId } = await danglingFixture();
  await expect(
    t.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("listByLesson: anonymous + dangling lessonId → NOT_AUTHENTICATED", async () => {
  const { t, lessonId } = await danglingFixture();
  await expect(
    t.query(api.features.comments.queries.listByLesson, { lessonId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("softDelete: anonymous + dangling commentId → NOT_AUTHENTICATED", async () => {
  const { t, commentId } = await danglingFixture();
  await expect(
    t.mutation(api.features.comments.comments.softDelete, { commentId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});
