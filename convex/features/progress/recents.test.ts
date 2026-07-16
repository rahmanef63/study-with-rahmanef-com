/// <reference types="vite/client" />
// Specs recentCourses (v1.7 #37) — DoD §5.2: authz-denied path (P0),
// own-rows-only by construction, dedupe per course, published/active guard,
// bounded output.
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { RECENT_TAKE } from "./recents";
import {
  asUser,
  seedCourseWithLessons,
  seedTenantFixture,
  setup,
  type T,
  type TenantFixture,
} from "./test.helpers";

const fn = api.features.progress.recents.recentCourses;

async function complete(
  t: T,
  fx: TenantFixture,
  userId: Id<"users">,
  courseId: Id<"courses">,
  lessonId: Id<"lessons">
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId,
      userId,
      courseId,
      lessonId,
    });
  });
}

test("anonymous → NOT_AUTHENTICATED (auth before any read)", async () => {
  const t = setup();
  await seedTenantFixture(t);
  await expect(t.query(fn, {})).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("recents milik SENDIRI saja, newest-first, dedupe per course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const a = await seedCourseWithLessons(t, fx, "published", 2, "kelas-a");
  const b = await seedCourseWithLessons(t, fx, "published", 1, "kelas-b");

  // member: kelas A (2x, lama) lalu kelas B (baru) → urutan B, A tanpa duplikat.
  await complete(t, fx, fx.memberId, a.courseId, a.lessonIds[0]);
  await complete(t, fx, fx.memberId, a.courseId, a.lessonIds[1]);
  await complete(t, fx, fx.memberId, b.courseId, b.lessonIds[0]);
  // aktivitas user LAIN tidak boleh ikut.
  await complete(t, fx, fx.instructorId, a.courseId, a.lessonIds[0]);

  const rows = await t.withIdentity(asUser(fx.memberId)).query(fn, {});
  expect(rows.map((r) => r.courseSlug)).toEqual(["kelas-b", "kelas-a"]);
  expect(rows[0].lastAt).toBeGreaterThanOrEqual(rows[1].lastAt);
  // proyeksi eksplisit — tanpa id internal.
  expect(Object.keys(rows[0]).sort()).toEqual(["courseSlug", "lastAt", "tenantSlug", "title"]);
});

test("kelas draft/arsip & tenant non-active tidak meninggalkan kartu mati", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const pub = await seedCourseWithLessons(t, fx, "published", 1, "kelas-pub");
  const dra = await seedCourseWithLessons(t, fx, "draft", 1, "kelas-dra");
  const ars = await seedCourseWithLessons(t, fx, "archived", 1, "kelas-ars");
  await complete(t, fx, fx.memberId, dra.courseId, dra.lessonIds[0]);
  await complete(t, fx, fx.memberId, ars.courseId, ars.lessonIds[0]);
  await complete(t, fx, fx.memberId, pub.courseId, pub.lessonIds[0]);

  const rows = await t.withIdentity(asUser(fx.memberId)).query(fn, {});
  expect(rows.map((r) => r.courseSlug)).toEqual(["kelas-pub"]);

  // tenant disuspend → recents kosong (bukan error, bukan kartu mati).
  await t.run(async (ctx) => {
    await ctx.db.patch(fx.tenantId, { status: "suspended" });
  });
  expect(await t.withIdentity(asUser(fx.memberId)).query(fn, {})).toEqual([]);
});

test("output dibatasi RECENT_TAKE meski kelas lebih banyak", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  for (let i = 0; i < RECENT_TAKE + 3; i++) {
    const c = await seedCourseWithLessons(t, fx, "published", 1, `kelas-${i}`);
    await complete(t, fx, fx.memberId, c.courseId, c.lessonIds[0]);
  }
  const rows = await t.withIdentity(asUser(fx.memberId)).query(fn, {});
  expect(rows.length).toBe(RECENT_TAKE);
});
