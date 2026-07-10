/// <reference types="vite/client" />
// Query specs for listByLesson (#16): authz-denied paths, the soft-delete
// PLACEHOLDER contract (bodyMd never leaks after deletion — P0 assertion),
// author join via profiles, ordering, and the canModerate flag.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedComment, seedLesson, seedProfile, seedTenantFixture, setup } from "./test.helpers";

async function fixture(status: "draft" | "published" | "archived" = "published") {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lf = await seedLesson(t, fx, status);
  return { t, fx, ...lf };
}

describe("listByLesson — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, lessonId } = await fixture();
    await expect(
      t.query(api.features.comments.queries.listByLesson, { lessonId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider and cross-tenant member → NOT_AUTHORIZED", async () => {
    const { t, fx, lessonId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .query(api.features.comments.queries.listByLesson, { lessonId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(other.memberId))
        .query(api.features.comments.queries.listByLesson, { lessonId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("draft-course lesson: member → NOT_AUTHORIZED; instructor reads", async () => {
    const { t, fx, lessonId } = await fixture("draft");
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .query(api.features.comments.queries.listByLesson, { lessonId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    const res = await t.withIdentity(asUser(fx.instructorId))
      .query(api.features.comments.queries.listByLesson, { lessonId });
    expect(res.items).toEqual([]);
  });
});

describe("listByLesson — projection & ordering", () => {
  test("author join (public-profile fields only), mine flag, canModerate", async () => {
    const { t, fx, lessonId } = await fixture();
    await seedProfile(t, fx.memberId, "budi", "Budi Santoso");
    await seedComment(t, fx, lessonId, fx.memberId, "Halo dari Budi");
    await seedComment(t, fx, lessonId, fx.instructorId, "Tanpa profil"); // no profile row

    const asMember = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.comments.queries.listByLesson, { lessonId });
    expect(asMember.canModerate).toBe(false);
    const mineItem = asMember.items.find((i) => i.mine);
    expect(mineItem?.deleted).toBe(false);
    expect(mineItem?.author).toEqual({ displayName: "Budi Santoso", username: "budi" });
    const noProfile = asMember.items.find((i) => !i.mine);
    expect(noProfile?.author).toBeNull();
    // userId never appears in any projected item (public-profile join only).
    expect(JSON.stringify(asMember.items)).not.toContain(fx.memberId);

    const asInstructor = await t.withIdentity(asUser(fx.instructorId))
      .query(api.features.comments.queries.listByLesson, { lessonId });
    expect(asInstructor.canModerate).toBe(true);
  });

  test("soft-deleted → placeholder {deleted:true}; bodyMd NEVER leaks (P0)", async () => {
    const { t, fx, lessonId } = await fixture();
    const secret = "RAHASIA-tidak-boleh-bocor";
    const commentId = await seedComment(t, fx, lessonId, fx.memberId, secret);
    await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.softDelete, { commentId });

    const res = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.comments.queries.listByLesson, { lessonId });
    const item = res.items.find((i) => i._id === commentId);
    expect(item).toMatchObject({ deleted: true, bodyMd: null, author: null, mine: false });
    // The original body must not appear ANYWHERE in the serialized result.
    expect(JSON.stringify(res)).not.toContain(secret);
  });

  test("newest first; replies keep parentId for client-side nesting", async () => {
    const { t, fx, lessonId } = await fixture();
    const oldRoot = await seedComment(t, fx, lessonId, fx.memberId, "Root lama");
    const reply = await seedComment(t, fx, lessonId, fx.instructorId, "Balasan", { parentId: oldRoot });
    const newRoot = await seedComment(t, fx, lessonId, fx.memberId, "Root baru");

    const res = await t.withIdentity(asUser(fx.memberId))
      .query(api.features.comments.queries.listByLesson, { lessonId });
    expect(res.items.map((i) => i._id)).toEqual([newRoot, reply, oldRoot]); // desc
    expect(res.items.find((i) => i._id === reply)?.parentId).toBe(oldRoot);
    expect(res.items.find((i) => i._id === newRoot)?.parentId).toBeNull();
  });
});
