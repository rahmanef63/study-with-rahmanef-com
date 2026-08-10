// Seed kurikulum "Analisis Data dengan AI" — dari file CSV/spreadsheet mentah
// sampai insight & grafik siap presentasi, dipandu AI, tanpa background statistik.
// Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedAnalisisData:seedAnalisisDataContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
//
// BENTUK BARU (DECISIONS #37): kelas = daftar MATERI berurutan. Seed ini tidak
// lagi menulis `modules` dan tidak lagi mengisi `lessons.courseId/moduleId/order`
// — ia menulis materi milik TENANT lalu penempatan `courseLessons` 1..14, dan
// kuis menggantung di KELAS. Judul modul lama sengaja dibuang, bukan dipindah
// jadi heading: modul sudah hilang dari produk.
//
// IDEMPOTEN PER BARIS, bukan per kelas. Produksi sudah berisi kelas ini beserta
// 14 materi yang sudah di-slug oleh materiBackfill, jadi "kelas ada → lewati
// semua" tidak cukup: setiap materi dicari lewat `lessons.by_tenant_slug` dan
// setiap penempatan lewat `courseLessons.by_course_lesson` sebelum ditulis.
// Run kedua menyisipkan NOL baris dan tidak menomori ulang apa pun.
// Aturan mainnya ada di _seed/curriculum.ts; isinya di _seed/analisisDataData.ts.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { ANALISIS_DATA_CURRICULUM } from "./_seed/analisisDataData";
import { resolveSeedTarget, upsertCurriculum } from "./_seed/curriculum";

export const seedAnalisisDataContent = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const target = await resolveSeedTarget(ctx, args);
    const made = await upsertCurriculum(ctx, {
      ...target,
      curriculum: ANALISIS_DATA_CURRICULUM,
    });
    return { ...made, note: "analisis-data-dengan-ai curriculum seeded (idempotent per row)" };
  },
});
