/// <reference types="vite/client" />
// setTags — authz (author OR instructor+), normalisation, and the DIFF.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, seedMateri, seedTenantFixture, setup, type T } from "./test.helpers";

const tagRows = (t: T, lessonId: Id<"lessons">) =>
  t.run(async (ctx) =>
    ctx.db
      .query("lessonTags")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .take(50)
  );

test("setTags: anon NOT_AUTHENTICATED, outsider + non-author member NOT_AUTHORIZED", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { authorId: fx.instructorId });
  const args = { lessonId, tags: ["agent"] };

  await expect(t.mutation(api.features.materi.tags.setTags, args)).rejects.toThrow(
    /NOT_AUTHENTICATED/
  );
  await expect(
    t.withIdentity(asUser(fx.outsiderId)).mutation(api.features.materi.tags.setTags, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.materi.tags.setTags, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);
  expect(await tagRows(t, lessonId)).toHaveLength(0);
});

test("setTags: the AUTHOR may tag their own materi even as a plain member", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { authorId: fx.memberId });

  const tags = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.materi.tags.setTags, { lessonId, tags: ["agent"] });
  expect(tags).toEqual(["agent"]);
  // …and so may an instructor who did not write it.
  expect(
    await t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.materi.tags.setTags, { lessonId, tags: ["agent", "hermes"] })
  ).toEqual(["agent", "hermes"]);
});

test("setTags: lowercased, trimmed, whitespace-joined, deduped", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx);

  const tags = await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.materi.tags.setTags, {
      lessonId,
      tags: ["  Claude Code ", "CLAUDE-CODE", "agent", "", "   "],
    });
  expect(tags).toEqual(["claude-code", "agent"]);
  expect((await tagRows(t, lessonId)).map((r) => r.tag).sort()).toEqual([
    "agent",
    "claude-code",
  ]);
});

test("setTags: rejects junk characters, over-long tags and too many tags", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx);
  const call = (tags: string[]) =>
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.materi.tags.setTags, { lessonId, tags });

  await expect(call(["prompt#1"])).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(call(["a"])).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(call(["x".repeat(33)])).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    call(Array.from({ length: 13 }, (_, i) => `tag-${i}`))
  ).rejects.toThrow(/VALIDATION_FAILED/);
  expect(await tagRows(t, lessonId)).toHaveLength(0); // nothing written on failure
});

test("setTags: DIFFS — surviving rows keep their identity, removals are deleted", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx);
  const call = (tags: string[]) =>
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.materi.tags.setTags, { lessonId, tags });

  await call(["agent", "prompting"]);
  const before = await tagRows(t, lessonId);
  const agentRowId = before.find((row) => row.tag === "agent")!._id;

  await call(["agent", "hermes"]);
  const after = await tagRows(t, lessonId);
  expect(after.map((r) => r.tag).sort()).toEqual(["agent", "hermes"]);
  // The kept tag was NOT deleted and reinserted.
  expect(after.find((row) => row.tag === "agent")!._id).toBe(agentRowId);

  // Clearing is a legal write.
  expect(await call([])).toEqual([]);
  expect(await tagRows(t, lessonId)).toHaveLength(0);
});

test("setTags: an existing duplicate row is pruned by the diff", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx);
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonTags", { tenantId: fx.tenantId, tag: "agent", lessonId });
    await ctx.db.insert("lessonTags", { tenantId: fx.tenantId, tag: "agent", lessonId });
  });

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.materi.tags.setTags, { lessonId, tags: ["agent"] });
  expect(await tagRows(t, lessonId)).toHaveLength(1);
});
