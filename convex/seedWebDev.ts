// Seed kurikulum "Bikin Aplikasi Web dengan AI" — dari nol (HTML/CSS/JS) sampai
// deploy. Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedWebDev:seedWebDevContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
//
// BENTUK BARU (DECISIONS #37): kelas = daftar MATERI berurutan. Seed ini tidak
// lagi menulis `modules` dan tidak lagi mengisi `lessons.courseId/moduleId/order`
// — ia menulis materi milik TENANT lalu penempatan `courseLessons` 1..17, dan
// kuis menggantung di KELAS. Judul modul lama sengaja dibuang, bukan dipindah
// jadi heading: modul sudah hilang dari produk.
//
// IDEMPOTEN PER BARIS, bukan per kelas. Produksi sudah berisi kelas ini beserta
// 17 materi yang sudah di-slug oleh materiBackfill, jadi "kelas ada → lewati
// semua" tidak cukup: setiap materi dicari lewat `lessons.by_tenant_slug` dan
// setiap penempatan lewat `courseLessons.by_course_lesson` sebelum ditulis.
// Run kedua menyisipkan NOL baris dan tidak menomori ulang apa pun.
// Aturan mainnya ada di _seed/curriculum.ts; isinya di _seed/webDevData.ts.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { resolveSeedTarget, upsertCurriculum } from "./_seed/curriculum";
import { WEB_DEV_CURRICULUM } from "./_seed/webDevData";

export const seedWebDevContent = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const target = await resolveSeedTarget(ctx, args);
    const made = await upsertCurriculum(ctx, {
      ...target,
      curriculum: WEB_DEV_CURRICULUM,
    });
    return { ...made, note: "web-dev curriculum seeded (idempotent per row)" };
  },
});
