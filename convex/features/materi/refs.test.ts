/// <reference types="vite/client" />
// syncRefs — internal, so the authz assertion is that it is UNREACHABLE from a
// client (no api.* entry point); the rest is sanitisation + the diff.
import { expect, test } from "vitest";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedMateri, seedTenantFixture, setup, type T } from "./test.helpers";
import { syncRefs } from "./refs";

const refRows = (t: T, fromLessonId: Id<"lessons">) =>
  t.run(async (ctx) =>
    ctx.db
      .query("lessonRefs")
      .withIndex("by_from", (q) => q.eq("fromLessonId", fromLessonId))
      .take(100)
  );

// AUTHZ, for a function whose authorization IS its internal-ness: no client can
// reach it, so the assertion is on the registration itself rather than on a
// denied call. (`lessonRefs` is derived data — there is no user action to gate.)
test("syncRefs is registered INTERNAL, never public", () => {
  const registered = syncRefs as unknown as { isInternal?: boolean; isPublic?: boolean };
  expect(registered.isInternal).toBe(true);
  expect(registered.isPublic).toBeUndefined();
});

test("syncRefs: writes the graph, then diffs it on re-save", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const from = await seedMateri(t, fx, { slug: "hermes", title: "Hermes" });
  const a = await seedMateri(t, fx, { slug: "a", title: "A" });
  const b = await seedMateri(t, fx, { slug: "b", title: "B" });
  const c = await seedMateri(t, fx, { slug: "c", title: "C" });

  const first = await t.mutation(internal.features.materi.refs.syncRefs, {
    lessonId: from,
    toLessonIds: [a, b],
  });
  expect(first).toEqual({ refs: 2, added: 2, removed: 0 });
  const keptId = (await refRows(t, from)).find((row) => row.toLessonId === a)!._id;

  const second = await t.mutation(internal.features.materi.refs.syncRefs, {
    lessonId: from,
    toLessonIds: [a, c],
  });
  expect(second).toEqual({ refs: 2, added: 1, removed: 1 });
  const rows = await refRows(t, from);
  expect(rows.map((row) => row.toLessonId).sort()).toEqual([a, c].sort());
  expect(rows.find((row) => row.toLessonId === a)!._id).toBe(keptId);

  // An unchanged re-save writes nothing.
  expect(
    await t.mutation(internal.features.materi.refs.syncRefs, {
      lessonId: from,
      toLessonIds: [a, c],
    })
  ).toEqual({ refs: 2, added: 0, removed: 0 });
});

test("syncRefs: drops self-references, duplicates, dead ids and cross-tenant targets", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const other = await seedTenantFixture(t, "komunitas-lain");
  const from = await seedMateri(t, fx, { slug: "hermes", title: "Hermes" });
  const a = await seedMateri(t, fx, { slug: "a", title: "A" });
  const foreign = await seedMateri(t, other, { slug: "asing", title: "Asing" });
  const dead = await seedMateri(t, fx, { slug: "hilang", title: "Hilang" });
  await t.run(async (ctx) => ctx.db.delete(dead));

  const result = await t.mutation(internal.features.materi.refs.syncRefs, {
    lessonId: from,
    toLessonIds: [from, a, a, foreign, dead],
  });
  expect(result.refs).toBe(1);
  expect((await refRows(t, from)).map((row) => row.toLessonId)).toEqual([a]);
});

test("syncRefs: caps the reference count and NOT_FOUNDs an unknown source", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const from = await seedMateri(t, fx, { slug: "hermes", title: "Hermes" });
  const targets: Array<Id<"lessons">> = [];
  for (let i = 0; i < 55; i++) {
    targets.push(await seedMateri(t, fx, { slug: `t-${i}`, title: `T ${i}` }));
  }
  const result = await t.mutation(internal.features.materi.refs.syncRefs, {
    lessonId: from,
    toLessonIds: targets,
  });
  expect(result.refs).toBe(50); // MAX_REFS_PER_LESSON

  const ghost = await seedMateri(t, fx, { slug: "ghost", title: "Ghost" });
  await t.run(async (ctx) => ctx.db.delete(ghost));
  await expect(
    t.mutation(internal.features.materi.refs.syncRefs, {
      lessonId: ghost,
      toLessonIds: [],
    })
  ).rejects.toThrow(/NOT_FOUND/);
});

test("a synced reference shows up as a backlink on the target", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const from = await seedMateri(t, fx, { slug: "hermes", title: "Hermes", status: "published" });
  const target = await seedMateri(t, fx, {
    slug: "sub-agents",
    title: "Sub Agents",
    status: "published",
  });
  await t.mutation(internal.features.materi.refs.syncRefs, {
    lessonId: from,
    toLessonIds: [target],
  });

  const backlinks = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.materi.queries.backlinksFor, { lessonId: target });
  expect(backlinks.materi.map((m) => m.slug)).toEqual(["hermes"]);
});
