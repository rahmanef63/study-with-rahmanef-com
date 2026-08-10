// Extra community: "Karier Digital bareng Rahman" — its own courses, welcome
// post and curated links. One community per file, same reasoning as the
// per-course split.
//
// Each course is a FLAT list of materi (DECISIONS #37) — module headings
// dropped, one quiz per course.
import type { SeedCommunity } from "./types";

export const COMMUNITY_KARIER_DIGITAL: SeedCommunity = {
  slug: "karier-digital",
  name: "Karier Digital bareng Rahman",
  description:
    "Bangun karier digital dari nol — portofolio, freelance, dan skill yang dicari pasar. Berbahasa Indonesia.",
  track: "kerja",
  courses: [
    {
      slug: "portofolio-dilirik",
      title: "Portofolio yang Dilirik",
      description: "Susun portofolio yang bikin recruiter & klien berhenti scroll.",
      lessons: [
        {
          title: "Portofolio mengalahkan CV",
          contentMd: `## Kenapa portofolio menang

CV cuma klaim; portofolio itu **bukti**. Recruiter & klien percaya yang bisa mereka lihat.

- Tunjukkan hasil nyata, bukan daftar skill.
- 3 proyek fokus > 10 proyek asal.

## Belum punya proyek?

Bikin proyek latihan yang menyelesaikan masalah nyata — redesign, studi kasus, atau otomasi kecil.`,
        },
        {
          title: "3 proyek yang wajib ada",
          contentMd: `## Formula 3 proyek

1. **Proyek unggulan** — paling niche, paling dalam.
2. **Proyek proses** — tunjukkan cara berpikirmu (before → after).
3. **Proyek kolaborasi** — bukti bisa kerja tim.

Tiap proyek: **masalah → yang kamu lakukan → hasil terukur.**`,
        },
      ],
      quizzes: [
        {
          title: "Kuis: Portofolio",
          passingScorePct: 60,
          questions: [
            { prompt: "Portofolio unggul dari CV karena…", options: ["Lebih panjang", "Menunjukkan bukti nyata", "Lebih formal", "Wajib PDF"], correctIndex: 1 },
            { prompt: "Idealnya portofolio berisi…", options: ["Sebanyak mungkin proyek", "3 proyek fokus & dalam", "Hanya sertifikat", "Screenshot acak"], correctIndex: 1 },
            { prompt: "Tiap proyek sebaiknya menampilkan…", options: ["Harga jasa", "Masalah → aksi → hasil", "Riwayat pendidikan", "Hobi"], correctIndex: 1 },
          ],
        },
      ],
    },
    {
      slug: "freelance-nol",
      title: "Freelance dari Nol",
      description: "Dapat klien pertama tanpa koneksi orang dalam.",
      lessons: [
        {
          title: "Pilih niche & skill",
          contentMd: `## Niche bikin kamu dicari

Generalis susah dibedakan; spesialis gampang direkomendasikan.

- Pilih irisan: **skill yang kamu bisa × masalah yang dibayar orang.**
- Contoh: "desain feed IG untuk UMKM kuliner".`,
        },
        {
          title: "Cari klien pertama",
          contentMd: `## Tempat berburu

- **Jaringan terdekat** (teman, komunitas) — konversi tertinggi.
- **Marketplace** (Fiverr, Sribu) untuk isi portofolio awal.
- **Outbound**: DM bernilai, bukan spam "nawarin jasa".

## Tawaran yang menang

Fokus ke **hasil untuk klien**, bukan daftar fitur jasamu.`,
        },
      ],
      quizzes: [
        {
          title: "Kuis: Freelance",
          passingScorePct: 60,
          questions: [
            { prompt: "Kenapa memilih niche?", options: ["Biar sempit", "Biar mudah dibedakan & direkomendasikan", "Biar mahal", "Karena wajib"], correctIndex: 1 },
            { prompt: "Sumber klien pertama dengan konversi tertinggi biasanya…", options: ["Iklan berbayar", "Jaringan terdekat", "Cold email massal", "SEO"], correctIndex: 1 },
            { prompt: "Tawaran yang kuat menekankan…", options: ["Fitur jasa", "Hasil untuk klien", "Harga termurah", "Portofolio panjang"], correctIndex: 1 },
          ],
        },
      ],
    },
  ],
  welcome: {
    title: "Selamat datang di Karier Digital! 💼",
    bodyMd: `Komunitas ini fokus ke **karier digital yang nyata**. Mulai dari dua kelas:

- **Portofolio yang Dilirik** — bukti > klaim.
- **Freelance dari Nol** — dapat klien pertama.

Buka tab **Kelas** dan kerjakan langkah demi langkah.`,
  },
  sumber: [
    { title: "Template studi kasus portofolio", url: "https://www.notion.so", note: "Kerangka before → after untuk tiap proyek." },
  ],
};
