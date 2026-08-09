/// <reference types="vite/client" />
// Authz-ORDER regression specs (pattern: comments/authz-order.test.ts; STATUS
// drift log 2026-07-06). Discriminator = a DANGLING id (seed → delete → call
// anonymously). Read-first code would resolve null → NOT_FOUND, which is an
// existence oracle for anonymous callers; auth-first code rejects
// NOT_AUTHENTICATED before any DB read — so these FAIL on read-first code.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { seedPost, seedTenantFixture, setup } from "./test.helpers";

async function danglingFixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const postId = await seedPost(t, fx, fx.memberId);
  await t.run(async (ctx) => {
    await ctx.db.delete(postId);
  });
  return { t, fx, postId };
}

test("edit: anonymous + dangling postId → NOT_AUTHENTICATED (never NOT_FOUND)", async () => {
  const { t, postId } = await danglingFixture();
  await expect(
    t.mutation(api.features.posts.posts.edit, { postId, title: "Judul baru" })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("softDelete: anonymous + dangling postId → NOT_AUTHENTICATED", async () => {
  const { t, postId } = await danglingFixture();
  await expect(
    t.mutation(api.features.posts.posts.softDelete, { postId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("togglePin: anonymous + dangling postId → NOT_AUTHENTICATED", async () => {
  const { t, postId } = await danglingFixture();
  await expect(
    t.mutation(api.features.posts.posts.togglePin, { postId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("toggleLike: anonymous + dangling postId → NOT_AUTHENTICATED", async () => {
  const { t, postId } = await danglingFixture();
  await expect(
    t.mutation(api.features.posts.likes.toggleLike, { postId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("create: anonymous + dangling tenantId → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await t.run(async (ctx) => {
    await ctx.db.delete(fx.tenantId);
  });
  await expect(
    t.mutation(api.features.posts.posts.create, {
      tenantId: fx.tenantId,
      kind: "diskusi",
      title: "Judul yang cukup",
      bodyMd: "Isi.",
    })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("listMine: anonymous + dangling tenantId → NOT_AUTHENTICATED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await t.run(async (ctx) => {
    await ctx.db.delete(fx.tenantId);
  });
  await expect(
    t.query(api.features.posts.queries.listMine, { tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
});
