/// <reference types="vite/client" />
// Mutation specs for edit / softDelete / togglePin (v1.8 #29). Every mutation
// asserts the authz-DENIED paths (unauthenticated + wrong role) — P0, DoD §5.2.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedPost, seedTenantFixture, setup } from "./test.helpers";

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const postId = await seedPost(t, fx, fx.memberId, { title: "Punya member" });
  return { t, fx, postId };
}

describe("edit", () => {
  test("anonymous, outsider, non-author member and cross-tenant instructor → denied", async () => {
    const { t, fx, postId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    // A post the plain member did NOT write — only its author or instructor+ may edit.
    const guruPost = await seedPost(t, fx, fx.instructorId, { title: "Punya guru" });
    await expect(
      t.mutation(api.features.posts.posts.edit, { postId, title: "Dibajak" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .mutation(api.features.posts.posts.edit, { postId, title: "Dibajak" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.posts.posts.edit, { postId: guruPost, title: "Dibajak" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(other.instructorId))
        .mutation(api.features.posts.posts.edit, { postId, title: "Lintas tenant" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("author edits own; instructor+ edits a member's; '' clears an optional field", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, {
      title: "Judul lama",
      linkUrl: "https://contoh.id/lama",
    });
    await t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.edit, {
      postId,
      title: "  Judul baru  ",
      bodyMd: "Isi diperbarui.",
    });
    let row = await t.run((ctx) => ctx.db.get(postId));
    expect(row?.title).toBe("Judul baru");
    expect(row?.bodyMd).toBe("Isi diperbarui.");
    expect(row?.linkUrl).toBe("https://contoh.id/lama"); // untouched when omitted

    await t.withIdentity(asUser(fx.instructorId)).mutation(api.features.posts.posts.edit, {
      postId,
      linkUrl: "",
    });
    row = await t.run((ctx) => ctx.db.get(postId));
    expect(row?.linkUrl).toBeUndefined();
  });

  test("edit cannot change `kind` — no route around the pengumuman gate", async () => {
    const { t, fx, postId } = await fixture();
    // The mutation has no `kind` arg at all; the row keeps the kind it was
    // created with, so a member can never promote a diskusi to a pengumuman.
    await t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.posts.posts.edit, { postId, title: "Masih diskusi" });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.kind).toBe("diskusi");
  });

  test("editing a soft-deleted post → NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { deletedAt: Date.now() });
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.posts.posts.edit, { postId, title: "Hidup lagi?" })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("softDelete", () => {
  test("anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
    const { t, fx, postId } = await fixture();
    await expect(
      t.mutation(api.features.posts.posts.softDelete, { postId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.posts.posts.softDelete, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("author and instructor+ delete; soft only; second call is idempotent", async () => {
    const { t, fx, postId } = await fixture();
    await t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.softDelete, { postId });
    const row = await t.run((ctx) => ctx.db.get(postId));
    expect(row).not.toBeNull(); // soft, never hard
    const first = row?.deletedAt;
    expect(first).toBeTypeOf("number");
    await t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.softDelete, { postId });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.deletedAt).toBe(first);

    const second = await seedPost(t, fx, fx.memberId, { title: "Dimoderasi" });
    await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.posts.posts.softDelete, { postId: second });
    expect((await t.run((ctx) => ctx.db.get(second)))?.deletedAt).toBeTypeOf("number");
  });
});

describe("togglePin", () => {
  test("anonymous → NOT_AUTHENTICATED; the AUTHOR (plain member) → NOT_AUTHORIZED", async () => {
    const { t, fx, postId } = await fixture();
    await expect(
      t.mutation(api.features.posts.posts.togglePin, { postId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    // Pinning is moderation: even the post's own author cannot self-promote.
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.posts.posts.togglePin, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("instructor+ flips the flag both ways", async () => {
    const { t, fx, postId } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    expect(await as.mutation(api.features.posts.posts.togglePin, { postId })).toEqual({ pinned: true });
    expect((await t.run((ctx) => ctx.db.get(postId)))?.pinned).toBe(true);
    expect(await as.mutation(api.features.posts.posts.togglePin, { postId })).toEqual({ pinned: false });
  });
});

describe("membership revocation", () => {
  test("an author removed from the community loses edit AND softDelete", async () => {
    const { t, fx, postId } = await fixture();
    const as = t.withIdentity(asUser(fx.memberId));
    // Sanity: while still a member the author can edit their own post.
    await as.mutation(api.features.posts.posts.edit, {
      postId,
      title: "Masih anggota",
      bodyMd: "Boleh diubah.",
    });

    // Kick them out.
    await t.run(async (ctx) => {
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_tenant_user", (q) =>
          q.eq("tenantId", fx.tenantId).eq("userId", fx.memberId)
        )
        .unique();
      if (membership !== null) await ctx.db.delete(membership._id);
    });

    // The post stays live on an anonymously readable, sitemap-indexed feed, so
    // "remove this member" has to actually stop them editing it.
    await expect(
      as.mutation(api.features.posts.posts.edit, {
        postId,
        title: "Sudah bukan anggota",
        bodyMd: "Tidak boleh.",
      })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      as.mutation(api.features.posts.posts.softDelete, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });
});
