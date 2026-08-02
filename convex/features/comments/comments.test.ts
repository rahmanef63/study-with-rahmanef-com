/// <reference types="vite/client" />
// Mutation specs for the comments feature (#16). DoD §5.2 (P0): every
// mutation exercises the authz-DENIED paths (anonymous + wrong role), plus
// the assignment's named cases: depth-1 rejection, cross-tenant rejection,
// soft-delete semantics, anti-spam cap.
import { describe, expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { MAX_COMMENTS_PER_USER_PER_LESSON } from "./antiSpam";
import { MAX_BODY } from "./validate";
import { asUser, seedComment, seedLesson, seedTenantFixture, setup } from "./test.helpers";

async function fixture(status: "draft" | "published" | "archived" = "published") {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lf = await seedLesson(t, fx, status);
  return { t, fx, ...lf };
}

describe("addComment — authz", () => {
  test("anonymous → NOT_AUTHENTICATED", async () => {
    const { t, lessonId } = await fixture();
    await expect(
      t.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
  });

  test("outsider (no membership) → NOT_AUTHORIZED", async () => {
    const { t, fx, lessonId } = await fixture();
    await expect(
      t.withIdentity(asUser(fx.outsiderId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("cross-tenant member → NOT_AUTHORIZED", async () => {
    const { t, fx, lessonId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    await expect(
      t.withIdentity(asUser(other.memberId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    void fx;
  });

  test("member on a DRAFT-course lesson → NOT_AUTHORIZED; instructor passes", async () => {
    const { t, fx, lessonId } = await fixture("draft");
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
    const id = await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Halo" });
    expect(id).toBeDefined();
  });
});

describe("addComment — writes & validation", () => {
  test("member posts a root comment; tenantId comes from the LESSON row", async () => {
    const { t, fx, lessonId } = await fixture();
    // AnyApi _generated returns `any` — pin the id so ctx.db.get narrows.
    const id: Id<"comments"> = await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "  Halo kelas!  " });
    const row = await t.run((ctx) => ctx.db.get(id));
    expect(row?.tenantId).toBe(fx.tenantId);
    expect(row?.userId).toBe(fx.memberId);
    expect(row?.bodyMd).toBe("Halo kelas!"); // trimmed
    expect(row?.parentId).toBeUndefined();
  });

  test("body: whitespace-only and >2000 chars → VALIDATION_FAILED; 2000 exact passes", async () => {
    const { t, fx, lessonId } = await fixture();
    const as = t.withIdentity(asUser(fx.memberId));
    await expect(
      as.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "   " })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    await expect(
      as.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "x".repeat(MAX_BODY + 1) })
    ).rejects.toThrow(/VALIDATION_FAILED/);
    const id = await as.mutation(api.features.comments.comments.addComment, {
      lessonId,
      bodyMd: "x".repeat(MAX_BODY),
    });
    expect(id).toBeDefined();
  });

  test("reply to a root passes; reply to a REPLY → VALIDATION_FAILED (depth-1)", async () => {
    const { t, fx, lessonId } = await fixture();
    const as = t.withIdentity(asUser(fx.memberId));
    const rootId = await as.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Root" });
    const replyId = await as.mutation(api.features.comments.comments.addComment, {
      lessonId, bodyMd: "Balasan", parentId: rootId,
    });
    expect(replyId).toBeDefined();
    await expect(
      as.mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Balasan balasan", parentId: replyId })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test("parent from ANOTHER lesson (other tenant) → VALIDATION_FAILED", async () => {
    const { t, fx, lessonId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    const otherLesson = await seedLesson(t, other, "published", "kelas-lain");
    const foreignRoot = await seedComment(t, other, otherLesson.lessonId, other.memberId, "Root asing");
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Nyasar", parentId: foreignRoot })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test("reply to a soft-DELETED root → VALIDATION_FAILED", async () => {
    const { t, fx, lessonId } = await fixture();
    const deletedRoot = await seedComment(t, fx, lessonId, fx.memberId, "Sudah dihapus", { deletedAt: Date.now() });
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Balas hantu", parentId: deletedRoot })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  });

  test(`anti-spam: comment #${MAX_COMMENTS_PER_USER_PER_LESSON + 1} → RATE_LIMITED (others unaffected)`, async () => {
    const { t, fx, lessonId } = await fixture();
    for (let i = 0; i < MAX_COMMENTS_PER_USER_PER_LESSON; i++) {
      await seedComment(t, fx, lessonId, fx.memberId, `Komentar ${i}`);
    }
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Satu lagi" })
    ).rejects.toThrow(/RATE_LIMITED/);
    // A different user on the same lesson is not throttled.
    const id = await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.addComment, { lessonId, bodyMd: "Masih bisa" });
    expect(id).toBeDefined();
  });
});

describe("softDelete", () => {
  test("anonymous → NOT_AUTHENTICATED; other MEMBER → NOT_AUTHORIZED", async () => {
    const { t, fx, lessonId } = await fixture();
    const commentId = await seedComment(t, fx, lessonId, fx.instructorId, "Punya guru");
    await expect(
      t.mutation(api.features.comments.comments.softDelete, { commentId })
    ).rejects.toThrow(/NOT_AUTHENTICATED/);
    await expect(
      t.withIdentity(asUser(fx.memberId))
        .mutation(api.features.comments.comments.softDelete, { commentId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);
  });

  test("author deletes own; instructor+ deletes member's; sets deletedAt, never hard-deletes", async () => {
    const { t, fx, lessonId } = await fixture();
    const own = await seedComment(t, fx, lessonId, fx.memberId, "Punyaku");
    await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.softDelete, { commentId: own });
    const ownRow = await t.run((ctx) => ctx.db.get(own));
    expect(ownRow).not.toBeNull(); // soft, not hard
    expect(ownRow?.deletedAt).toBeTypeOf("number");

    const other = await seedComment(t, fx, lessonId, fx.memberId, "Dimoderasi");
    await t.withIdentity(asUser(fx.instructorId))
      .mutation(api.features.comments.comments.softDelete, { commentId: other });
    const otherRow = await t.run((ctx) => ctx.db.get(other));
    expect(otherRow?.deletedAt).toBeTypeOf("number");

    const third = await seedComment(t, fx, lessonId, fx.memberId, "Owner juga bisa");
    await t.withIdentity(asUser(fx.ownerId))
      .mutation(api.features.comments.comments.softDelete, { commentId: third });
    expect((await t.run((ctx) => ctx.db.get(third)))?.deletedAt).toBeTypeOf("number");
  });

  test("cross-tenant instructor → NOT_AUTHORIZED; second delete is an idempotent no-op", async () => {
    const { t, fx, lessonId } = await fixture();
    const other = await seedTenantFixture(t, "komunitas-lain");
    const commentId = await seedComment(t, fx, lessonId, fx.memberId, "Lintas tenant");
    await expect(
      t.withIdentity(asUser(other.instructorId))
        .mutation(api.features.comments.comments.softDelete, { commentId })
    ).rejects.toThrow(/NOT_AUTHORIZED/);

    await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.softDelete, { commentId });
    const first = (await t.run((ctx) => ctx.db.get(commentId)))?.deletedAt;
    await t.withIdentity(asUser(fx.memberId))
      .mutation(api.features.comments.comments.softDelete, { commentId });
    expect((await t.run((ctx) => ctx.db.get(commentId)))?.deletedAt).toBe(first);
  });
});
