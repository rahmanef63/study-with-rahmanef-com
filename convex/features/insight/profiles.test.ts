/// <reference types="vite/client" />
// saveProfile / myProfile — the assessment's ONLY persistence. The questionnaire
// itself never touches these; the specs below exist to prove that what does
// touch them can only ever read and write the caller's own row.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import { asUser, seedTenantFixture, setup } from "./test.helpers";

const PLAN = {
  answers: [
    { questionId: "modal", optionId: "gratis" },
    { questionId: "waktu", optionId: "sejam-sehari" },
  ],
  level: "pemula" as const,
  pathSlugs: ["dasar-ai", "prompting"],
};

test("saveProfile then myProfile: the plan comes back", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const as = t.withIdentity(asUser(fx.memberId));

  const saved = await as.mutation(api.features.insight.profiles.saveProfile, PLAN);
  expect(saved.level).toBe("pemula");
  expect(saved.pathSlugs).toEqual(["dasar-ai", "prompting"]);
  expect(saved.tenantId).toBeNull();
  expect(saved.updatedAt).toBeGreaterThan(0);

  const mine = await as.query(api.features.insight.profiles.myProfile, {});
  expect(mine?.level).toBe("pemula");
  expect(mine?.answers).toEqual(PLAN.answers);
});

test("myProfile before any assessment: null, not an error", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const mine = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.insight.profiles.myProfile, {});
  expect(mine).toBeNull();
});

test("retaking replaces the plan — ONE row per user, never a history", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const as = t.withIdentity(asUser(fx.memberId));

  await as.mutation(api.features.insight.profiles.saveProfile, PLAN);
  const second = await as.mutation(api.features.insight.profiles.saveProfile, {
    ...PLAN,
    level: "mahir",
    pathSlugs: ["multi-agent"],
  });

  expect(second.level).toBe("mahir");
  expect(second.pathSlugs).toEqual(["multi-agent"]);
  const rows = await t.run(async (ctx) =>
    ctx.db
      .query("learnerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", fx.memberId))
      .take(10)
  );
  expect(rows).toHaveLength(1);
});

test("two users keep separate plans; myProfile never returns someone else's", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.profiles.saveProfile, PLAN);
  await t.withIdentity(asUser(fx.member2Id)).mutation(api.features.insight.profiles.saveProfile, {
    ...PLAN,
    level: "menengah",
  });

  const one = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.insight.profiles.myProfile, {});
  const two = await t
    .withIdentity(asUser(fx.member2Id))
    .query(api.features.insight.profiles.myProfile, {});
  expect(one?.level).toBe("pemula");
  expect(two?.level).toBe("menengah");
});

test("NO membership required — the point is people who have joined nothing", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const saved = await t
    .withIdentity(asUser(fx.outsiderId))
    .mutation(api.features.insight.profiles.saveProfile, PLAN);
  expect(saved.level).toBe("pemula");
});

test("tenantId is optional provenance: an ACTIVE tenant sticks, membership irrelevant", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const saved = await t
    .withIdentity(asUser(fx.outsiderId))
    .mutation(api.features.insight.profiles.saveProfile, { ...PLAN, tenantId: fx.tenantId });
  expect(saved.tenantId).toBe(fx.tenantId);
});

test("a suspended tenant cannot be parked on the row", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  await t.run(async (ctx) => {
    await ctx.db.patch(fx.tenantId, { status: "suspended" });
  });
  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .mutation(api.features.insight.profiles.saveProfile, { ...PLAN, tenantId: fx.tenantId })
  ).rejects.toThrow(/NOT_FOUND/);
});

test("answers and slugs are normalised: trimmed, lowercased, deduped in order", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const saved = await t
    .withIdentity(asUser(fx.memberId))
    .mutation(api.features.insight.profiles.saveProfile, {
      answers: [{ questionId: "  Modal ", optionId: "GRATIS" }],
      level: "menengah",
      pathSlugs: ["Dasar-AI", "dasar-ai", " prompting "],
    });
  expect(saved.answers).toEqual([{ questionId: "modal", optionId: "gratis" }]);
  expect(saved.pathSlugs).toEqual(["dasar-ai", "prompting"]);
});

test("garbage in is rejected loudly, never stored", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const as = t.withIdentity(asUser(fx.memberId));
  const long = "x".repeat(65);

  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, { ...PLAN, answers: [] })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, {
      ...PLAN,
      answers: Array.from({ length: 25 }, (_, i) => ({ questionId: `q${i}`, optionId: "a" })),
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, {
      ...PLAN,
      answers: [
        { questionId: "modal", optionId: "gratis" },
        { questionId: "modal", optionId: "berbayar" },
      ],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, {
      ...PLAN,
      pathSlugs: ["<script>alert(1)</script>"],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, { ...PLAN, pathSlugs: [long] })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(
    as.mutation(api.features.insight.profiles.saveProfile, {
      ...PLAN,
      pathSlugs: Array.from({ length: 13 }, (_, i) => `p${i}`),
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  expect(await as.query(api.features.insight.profiles.myProfile, {})).toBeNull();
});
