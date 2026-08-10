// materi/content — the backlink half: what `saveContent` writes into
// `lessonRefs`, and the pure extractor that decides it.
import { describe, expect, it } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedMateri, seedTenantFixture, setup, type T } from "./test.helpers";
import { extractMateriSlugs } from "./materiLinks";

const para = (id: string, text: string) => ({ id, type: "paragraph", text });

function save(t: T, userId: Id<"users">, lessonId: Id<"lessons">, blocks: unknown[]) {
  return t
    .withIdentity(asUser(userId))
    .mutation(api.features.materi.content.saveContent, {
      lessonId,
      contentBlocks: JSON.stringify(blocks),
    });
}

async function refsOf(t: T, lessonId: Id<"lessons">) {
  return await t.run(async (ctx) =>
    await ctx.db
      .query("lessonRefs")
      .withIndex("by_from", (q) => q.eq("fromLessonId", lessonId))
      .collect(),
  );
}

describe("saveContent — reference reconciliation", () => {
  it("mints lessonRefs from canonical materi links in the saved content", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const from = await seedMateri(t, fx, { slug: "sub-agents", title: "Sub Agents" });
    const to = await seedMateri(t, fx, { slug: "hermes", title: "Hermes" });

    const result = await save(t, fx.instructorId, from, [
      para("b1", `Lihat [Hermes](/k/${fx.tenantSlug}/materi/hermes) dulu.`),
    ]);

    expect(result.refs).toBe(1);
    expect((await refsOf(t, from)).map((r) => r.toLessonId)).toEqual([to]);
  });

  it("drops a reference when the link is removed on the next save", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const from = await seedMateri(t, fx, { slug: "sub-agents" });
    await seedMateri(t, fx, { slug: "hermes" });

    await save(t, fx.instructorId, from, [
      para("b1", `[Hermes](/k/${fx.tenantSlug}/materi/hermes)`),
    ]);
    await save(t, fx.instructorId, from, [para("b1", "Tidak ada tautan lagi.")]);

    expect(await refsOf(t, from)).toHaveLength(0);
  });

  it("finds links nested inside toggles and table cells, and ignores unknown slugs", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const from = await seedMateri(t, fx, { slug: "sub-agents" });
    const nested = await seedMateri(t, fx, { slug: "hermes" });

    const result = await save(t, fx.instructorId, from, [
      {
        id: "b1",
        type: "toggle",
        text: "Detail",
        children: [para("c1", `[Hermes](/k/${fx.tenantSlug}/materi/hermes)`)],
      },
      {
        id: "b2",
        type: "paragraph",
        text: `[Belum ada](/k/${fx.tenantSlug}/materi/materi-hantu)`,
      },
    ]);

    expect(result.refs).toBe(1);
    expect((await refsOf(t, from)).map((r) => r.toLessonId)).toEqual([nested]);
  });

  it("does not self-reference when the materi links to its own canonical URL", async () => {
    const t = setup();
    const fx = await seedTenantFixture(t);
    const lessonId = await seedMateri(t, fx, { slug: "sub-agents" });

    const result = await save(t, fx.instructorId, lessonId, [
      para("b1", `[aku](/k/${fx.tenantSlug}/materi/sub-agents)`),
    ]);

    expect(result.refs).toBe(0);
    expect(await refsOf(t, lessonId)).toHaveLength(0);
  });
});

describe("extractMateriSlugs", () => {
  it("takes the canonical URL only, deduped, in first-appearance order", () => {
    const md = [
      "[a](/k/komunitas-test/materi/alfa)",
      "[b](/k/komunitas-test/materi/beta)",
      "[a again](/k/komunitas-test/materi/alfa)",
      "[in-course path](/k/komunitas-test/kelas/dasar/j57abc)",
      "[other tenant](/k/komunitas-lain/materi/gamma)",
    ].join("\n\n");
    expect(extractMateriSlugs(md, "komunitas-test")).toEqual(["alfa", "beta"]);
  });

  it("does not match a deeper path or a prefix of a longer slug", () => {
    expect(extractMateriSlugs("/k/t/materi/alfa/versi-2", "t")).toEqual([]);
    expect(extractMateriSlugs("/k/t/materi/alfa-lanjutan", "t")).toEqual(["alfa-lanjutan"]);
  });
});
