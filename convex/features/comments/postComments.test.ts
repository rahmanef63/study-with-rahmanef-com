/// <reference types="vite/client" />
// Post-branch specs for the comments feature (v1.8 #29): the lessonId/postId
// XOR, member-gated writes with the authz-DENIED paths (P0), the counter bump
// that must land in the SAME mutation, the per-post anti-spam cap, listByPost,
// and the post_reply notification producer.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import { MAX_COMMENTS_PER_USER_PER_POST } from "./antiSpam";
import {
  asUser,
  seedPost,
  seedPostComment,
  seedProfile,
  seedTenantFixture,
  setup,
  type T,
} from "./test.helpers";

/** Drain ctx.scheduler.runAfter(0, …) jobs (pattern: notifications/producer.test.ts). */
async function flushScheduled(t: T) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

async function inbox(t: T, userId: Id<"users">): Promise<Doc<"notifications">[]> {
  return await t.run(async (ctx) =>
    ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20)
  );
}

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const postId = await seedPost(t, fx, fx.memberId, { title: "Tanya soal prompt" });
  return { t, fx, postId };
}

describe("addComment — target XOR", () => {
  test("anonymous wins over the shape check (auth is the FIRST line, P0)", async () => {
    const { t } = await fixture();
    await expect(
      t.mutation(api.features.comments.comments.addComment, { bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("neither target and both targets → VALIDATION_FAILED", async () => {
    const { t, fx, postId } = await fixture();
    const lesson = await t.run(async (ctx) => {
      const courseId = await ctx.db.insert("courses", {
        tenantId: fx.tenantId,
        slug: "kelas-xor",
        title: "Kelas",
        description: "Deskripsi",
        status: "published",
        createdBy: fx.instructorId,
      });
      const moduleId = await ctx.db.insert("modules", {
        tenantId: fx.tenantId,
        courseId,
        title: "Modul",
        order: 1,
      });
      return ctx.db.insert("lessons", {
        tenantId: fx.tenantId,
        courseId,
        moduleId,
        title: "Lesson",
        contentMd: "Materi",
        links: [],
        order: 1,
      });
    });
    const as = t.withIdentity(asUser(fx.memberId));
    await expect(
      as.mutation(api.features.comments.comments.addComment, { bodyMd: "Halo" })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.mutation(api.features.comments.comments.addComment, {
        bodyMd: "Halo",
        postId,
        lessonId: lesson,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });
});

describe("addComment on a post — authz", () => {
  test("outsider and cross-tenant member → NOT_AUTHORIZED", async () => {
    const { t, fx, postId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    await expect(
      t.withIdentity(asUser(other.memberId))
        .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("a soft-deleted post accepts no comment → NOT_FOUND", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { deletedAt: Date.now() });
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_FOUND/);
  });
});

describe("addComment on a post — writes", () => {
  test("tenantId comes from the POST row; commentCount and lastActivityAt bump atomically", async () => {
    const { t, fx } = await fixture();
    const postId = await seedPost(t, fx, fx.memberId, { commentCount: 0, lastActivityAt: 1 });
    const id: Id<"comments"> = await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "  Jawaban  " });

    const comment = await t.run((ctx) => ctx.db.get(id));
    expect(comment?.tenantId).toBe(fx.tenantId);
    expect(comment?.postId).toBe(postId);
    expect(comment?.lessonId).toBeUndefined();
    expect(comment?.bodyMd).toBe("Jawaban");

    const post = await t.run((ctx) => ctx.db.get(postId));
    expect(post?.commentCount).toBe(1);
    expect(post?.lastActivityAt).toBeGreaterThan(1);
  });

  test("depth-1: reply to a root passes, reply to a reply and a foreign parent fail", async () => {
    const { t, fx, postId } = await fixture();
    const as = t.withIdentity(asUser(fx.instructorId));
    const rootId = await as.mutation(api.features.comments.comments.addComment, {
      postId,
      bodyMd: "Root",
    });
    const replyId = await as.mutation(api.features.comments.comments.addComment, {
      postId,
      bodyMd: "Balasan",
      parentId: rootId,
    });
    expect(replyId).toBeDefined();
    await expect(
      as.mutation(api.features.comments.comments.addComment, {
        postId,
        bodyMd: "Balasan balasan",
        parentId: replyId,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);

    const otherPost = await seedPost(t, fx, fx.memberId, { title: "Post lain" });
    const foreignRoot = await seedPostComment(t, fx, otherPost, fx.memberId, "Root asing");
    await expect(
      as.mutation(api.features.comments.comments.addComment, {
        postId,
        bodyMd: "Nyasar",
        parentId: foreignRoot,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test(`anti-spam: reply #${MAX_COMMENTS_PER_USER_PER_POST + 1} → RATE_LIMITED (others unaffected)`, async () => {
    const { t, fx, postId } = await fixture();
    for (let i = 0; i < MAX_COMMENTS_PER_USER_PER_POST; i++) {
      await seedPostComment(t, fx, postId, fx.memberId, `Balasan ${i}`);
    }
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Satu lagi" })
    ).rejects.toThrow(/RATE_LIMITED/);
    expect(
      await t.withIdentity(asUser(fx.instructorId))
        .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Masih bisa" })
    ).toBeDefined();
  });
});

describe("listByPost", () => {
  test("anonymous → NOT_AUTHENTICATED; outsider → NOT_AUTHORIZED", async () => {
    const { t, fx, postId } = await fixture();
    await expect(
      t.query(api.features.comments.queries.listByPost, { postId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .query(api.features.comments.queries.listByPost, { postId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("member reads the thread; deleted rows are placeholders and never leak the body", async () => {
    const { t, fx, postId } = await fixture();
    await seedProfile(t, fx.memberId, "budi", "Budi Santoso");
    await seedPostComment(t, fx, postId, fx.memberId, "Terlihat");
    await seedPostComment(t, fx, postId, fx.memberId, "RAHASIA", { deletedAt: Date.now() });

    const res = await t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.comments.queries.listByPost, { postId });
    expect(res.canModerate).toBe(false);
    expect(res.items).toHaveLength(2);
    expect(JSON.stringify(res)).not.toContain("RAHASIA");
    expect(res.items.find((i) => i.deleted)?.bodyMd).toBeNull();
  });
});

describe("post_reply producer", () => {
  test("a comment notifies the POST author, with the /post/<id> permalink", async () => {
    const { t, fx, postId } = await fixture();
    await seedProfile(t, fx.instructorId, "guru", "Bu Guru");
    await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Jawaban guru" });
    await flushScheduled(t);

    const rows = await inbox(t, fx.memberId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("post_reply");
    expect(rows[0]?.tenantId).toBe(fx.tenantId);
    expect(rows[0]?.href).toBe(`/k/komunitas-test/post/${postId}`);
    expect(rows[0]?.title).toBe("Balasan baru di postinganmu");
    expect(rows[0]?.body).toContain("Bu Guru");
    expect(rows[0]?.body).not.toContain("guru@"); // never the email
  });

  test("the post author commenting on their OWN post notifies nobody (P0)", async () => {
    const { t, fx, postId } = await fixture();
    await t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Nambahin" });
    await flushScheduled(t);
    expect(await inbox(t, fx.memberId)).toHaveLength(0);
  });

  test("replying to a third party's comment notifies BOTH, once each", async () => {
    const { t, fx, postId } = await fixture();
    const rootId = await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, { postId, bodyMd: "Komentar guru" });
    await t.withIdentity(asUser(fx.ownerId)).mutation(api.features.comments.comments.addComment, {
      postId,
      bodyMd: "Balasan owner",
      parentId: rootId,
    });
    await flushScheduled(t);

    const authorInbox = await inbox(t, fx.memberId); // post author
    expect(authorInbox.map((r) => r.kind)).toEqual(["post_reply", "post_reply"]);
    const parentInbox = await inbox(t, fx.instructorId); // parent comment author
    expect(parentInbox.map((r) => r.kind)).toEqual(["comment_reply"]);
    expect(await inbox(t, fx.ownerId)).toHaveLength(0); // the actor, never
  });
});
