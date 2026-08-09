/// <reference types="vite/client" />
// toggleLike specs (v1.8 #30): authz-denied paths (P0), the idempotent toggle,
// and the like → points ROUND TRIP — posts.likeCount and the AUTHOR's
// memberships.points must move together, inside one mutation, and never for a
// self-like (help.skool.com/article/31: 1 like = 1 point for the AUTHOR).
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, readPoints, seedPost, seedTenantFixture, setup, type T } from "./test.helpers";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const postId = await seedPost(t, fx, fx.memberId, { title: "Punya member" });
  return { t, fx, postId };
}

async function likeRows(t: T, postId: Id<"posts">): Promise<number> {
  return await t.run(async (ctx) => {
    const rows = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .take(50);
    return rows.length;
  });
}

describe("toggleLike — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, postId } = await fixture();
    await expect(
      t.mutation(api.features.posts.likes.toggleLike, { postId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider and cross-tenant member → NOT_AUTHORIZED", async () => {
    const { t, fx, postId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.posts.likes.toggleLike, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(other.memberId)).mutation(api.features.posts.likes.toggleLike, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("liking a soft-deleted post → NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { deletedAt: Date.now() });
    await expect(
      t.withIdentity(asUser(fx.instructorId)).mutation(api.features.posts.likes.toggleLike, { postId })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("toggleLike — counter & points round trip", () => {
  test("like then unlike: row, likeCount and the AUTHOR's points all return to start", async () => {
    const { t, fx, postId } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBeNull(); // pre-existing rows have no points

    expect(await as.mutation(api.features.posts.likes.toggleLike, { postId })).toEqual({
      liked: true,
      likeCount: 1,
    });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(1);
    expect(await likeRows(t, postId)).toBe(1);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBe(1); // author scored, undefined read as 0
    expect(await readPoints(t, fx.tenantId, fx.instructorId)).toBeNull(); // liker never scores

    expect(await as.mutation(api.features.posts.likes.toggleLike, { postId })).toEqual({
      liked: false,
      likeCount: 0,
    });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(0);
    expect(await likeRows(t, postId)).toBe(0);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBe(0);
  });

  test("two likers add up; unliking one leaves the other's point in place", async () => {
    const { t, fx, postId } = await fixture();
    await t.withIdentity(asUser(fx.instructorId)).mutation(api.features.posts.likes.toggleLike, { postId });
    await t.withIdentity(asUser(fx.ownerId)).mutation(api.features.posts.likes.toggleLike, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(2);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBe(2);

    await t.withIdentity(asUser(fx.ownerId)).mutation(api.features.posts.likes.toggleLike, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(1);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBe(1);
  });

  test("SELF-like counts on the post but NEVER awards the author a point", async () => {
    const { t, fx, postId } = await fixture();
    const as = t.withIdentity(asUser(fx.memberId)); // the author
    await as.mutation(api.features.posts.likes.toggleLike, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(1);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBeNull(); // untouched

    await as.mutation(api.features.posts.likes.toggleLike, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.likeCount).toBe(0);
    expect(await readPoints(t, fx.tenantId, fx.memberId)).toBeNull();
  });

  test("a NEW like bumps lastActivityAt; taking it back does not un-bump", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { lastActivityAt: 1 });
    const as = t.withIdentity(asUser(fx.instructorId));
    await as.mutation(api.features.posts.likes.toggleLike, { postId });
    const bumped = (await t.run((ctx) => ctx.db.get(postId)))?.lastActivityAt ?? 0;
    expect(bumped).toBeGreaterThan(1);
    await as.mutation(api.features.posts.likes.toggleLike, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.lastActivityAt).toBe(bumped);
  });
});

describe("myLikedPostIds", () => {
  test("anonymous → NOT_AUTHENTICATED; otherwise the CALLER's own likes only", async () => {
    const { t, fx, postId } = await fixture();
    const otherPost = await seedPost(t, fx, fx.instructorId, { title: "Post kedua" });
    await expect(
      t.query(api.features.posts.likes.myLikedPostIds, { postIds: [postId] })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);

    await t.withIdentity(asUser(fx.instructorId)).mutation(api.features.posts.likes.toggleLike, { postId });
    expect(
      await t
        .withIdentity(asUser(fx.instructorId))
        .query(api.features.posts.likes.myLikedPostIds, { postIds: [postId, otherPost] })
    ).toEqual([postId]);
    // Another member sees NONE of the instructor's likes.
    expect(
      await t
        .withIdentity(asUser(fx.memberId))
        .query(api.features.posts.likes.myLikedPostIds, { postIds: [postId, otherPost] })
    ).toEqual([]);
  });
});
