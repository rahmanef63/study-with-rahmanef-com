// materi/content — the ONE write path for materi bodies.
// Covers: the derived-markdown invariant, the payload guards, and the
// authz-denied path for every role (P0, AGENTS.md §5.2). The backlink half
// lives in contentRefs.test.ts.
import { describe, expect, it } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedMateri, seedTenantFixture, setup, type T, type TenantFixture } from "./test.helpers";

const para = (id: string, text: string) => ({ id, type: "paragraph", text });

function save(t: T, userId: Id<"users">, lessonId: Id<"lessons">, blocks: unknown[]) {
  return t
    .withIdentity(asUser(userId))
    .mutation(api.features.materi.content.saveContent, {
      lessonId,
      contentBlocks: JSON.stringify(blocks),
    });
}

async function readLesson(t: T, lessonId: Id<"lessons">) {
  return await t.run(async (ctx) => await ctx.db.get(lessonId));
}

describe("saveContent — the storage invariant", () => {
  it("derives contentMd from the blocks and writes both columns together", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);

    await save(t, fx.instructorId, lessonId, [
      { id: "b1", type: "h1", text: "Judul" },
      para("b2", "Paragraf pertama."),
      { id: "b3", type: "todo", text: "Kerjakan ini", checked: true },
    ]);

    const lesson = await readLesson(t, lessonId);
    expect(lesson?.contentBlocks).toContain('"id":"b1"');
    expect(lesson?.contentMd).toBe("# Judul\n\nParagraf pertama.\n\n- [x] Kerjakan ini\n");
    // The seeded markdown is gone — nothing survives that the blocks did not say.
    expect(lesson?.contentMd).not.toContain("rahasia");
  });

  it("re-derives on every save, so the two columns can never drift", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);

    await save(t, fx.instructorId, lessonId, [para("b1", "Versi satu.")]);
    await save(t, fx.instructorId, lessonId, [para("b1", "Versi dua.")]);

    const lesson = await readLesson(t, lessonId);
    expect(lesson?.contentMd).toBe("Versi dua.\n");
    expect(lesson?.contentBlocks).not.toContain("Versi satu");
  });
});

describe("saveContent — payload guards", () => {
  const bad = async (fx: TenantFixture, t: T, lessonId: Id<"lessons">, contentBlocks: string) =>
    await expect(
      t
        .withIdentity(asUser(fx.instructorId))
        .mutation(api.features.materi.content.saveContent, { lessonId, contentBlocks }),
    ).rejects.toThrow(/tidak valid|terlalu panjang|Maksimal/);

  it("rejects malformed JSON, a non-array root, and a block with no id/type", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);

    await bad(fx, t, lessonId, "{ not json");
    await bad(fx, t, lessonId, JSON.stringify({ blocks: [] }));
    await bad(fx, t, lessonId, JSON.stringify([{ type: "paragraph", text: "no id" }]));

    // Not one of them landed a partial write.
    const lesson = await readLesson(t, lessonId);
    expect(lesson?.contentBlocks).toBeUndefined();
    expect(lesson?.contentMd).toContain("rahasia");
  });

  it("rejects a payload past the size cap", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);
    await bad(fx, t, lessonId, JSON.stringify([para("b1", "x".repeat(400_001))]));
  });
});

describe("saveContent — authz (P0)", () => {
  it("rejects anonymous, outsider and plain member, and writes nothing", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);
    const contentBlocks = JSON.stringify([para("b1", "Diretas.")]);
    const args = { lessonId, contentBlocks };

    await expect(
      t.mutation(api.features.materi.content.saveContent, args),
    ).rejects.toThrow();
    await expect(
      t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.materi.content.saveContent, args),
    ).rejects.toThrow();
    await expect(
      t.withIdentity(asUser(fx.memberId)).mutation(api.features.materi.content.saveContent, args),
    ).rejects.toThrow();

    const lesson = await readLesson(t, lessonId);
    expect(lesson?.contentBlocks).toBeUndefined();
    expect(lesson?.contentMd).toContain("rahasia");
  });

  it("allows instructor and owner", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);

    await save(t, fx.instructorId, lessonId, [para("b1", "Oleh pengajar.")]);
    await save(t, fx.ownerId, lessonId, [para("b1", "Oleh pemilik.")]);
    expect((await readLesson(t, lessonId))?.contentMd).toBe("Oleh pemilik.\n");
  });

  it("a dangling lessonId is NOT_FOUND for an authenticated caller and never writes", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx);
    await t.run(async (ctx) => await ctx.db.delete(lessonId));

    await expect(
      save(t, fx.instructorId, lessonId, [para("b1", "hantu")]),
    ).rejects.toThrow(/tidak ditemukan/i);
  });
});
