// asisten feature — konteks materi untuk tutor (#35). INTERNAL query: hanya
// dipanggil dari action `ask` yang SUDAH meng-autentikasi pengguna; userId
// diteruskan eksplisit karena identity tidak menyeberang runQuery internal.
// Membership dicek DI SINI (server boundary): konten lesson adalah member-only
// (akses tabel langsung ≈ pola comments/access.ts — table access ≠ code import).
import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { fail } from "./errors";
import type { LessonContext } from "./prompt";

export const lessonContext = internalQuery({
  args: { lessonId: v.string(), userId: v.id("users") },
  handler: async (ctx, args): Promise<LessonContext> => {
    // Id datang sebagai string dari client (arg action) — normalisasi dulu;
    // id ngawur = NOT_FOUND yang seragam (tanpa oracle).
    const lessonId = ctx.db.normalizeId("lessons", args.lessonId);
    if (lessonId === null) fail("NOT_FOUND", "Materi tidak ditemukan");
    const lesson = await ctx.db.get(lessonId);
    if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");

    // Member-gate: penanya harus anggota tenant pemilik materi.
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", lesson.tenantId).eq("userId", args.userId)
      )
      .unique();
    if (membership === null) {
      fail("NOT_AUTHORIZED", "Materi ini hanya untuk anggota komunitasnya");
    }

    // Kelas harus published — draft tidak pernah bocor lewat asisten (P0 §6).
    const course = await ctx.db.get(lesson.courseId);
    if (course === null || course.status !== "published") {
      fail("NOT_FOUND", "Materi tidak ditemukan");
    }

    return {
      lessonTitle: lesson.title,
      courseTitle: course.title,
      contentMd: lesson.contentMd,
    };
  },
});
