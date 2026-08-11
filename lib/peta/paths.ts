// The path catalogue — DATA, not branching code. Adding a route through the
// platform is one entry here plus one scoring function in match.ts.
//
// Slugs are the real seeded ones (convex/_seed/*, convex/seed*.ts). Titles are
// the seeded titles verbatim so a card and the page it opens agree.
import type { PetaAnswers } from "./types";
import type { CourseRef, Level, PathId } from "./result";

const BELAJAR_AI = "belajar-ai";
const KARIER = "karier-digital";
const KREATOR = "kreator-konten";

const c = (communitySlug: string, courseSlug: string, title: string): CourseRef => ({
  communitySlug,
  courseSlug,
  title,
});

export const COURSE = {
  dasar: c(BELAJAR_AI, "dasar-ai", "Dasar AI untuk Semua"),
  prompt: c(BELAJAR_AI, "prompt-engineering", "Prompt Engineering Praktis"),
  kerja: c(BELAJAR_AI, "ai-produktivitas-kerja", "AI untuk Produktivitas Kerja"),
  data: c(BELAJAR_AI, "analisis-data-dengan-ai", "Analisis Data dengan AI — dari Spreadsheet Mentah sampai Insight"),
  web: c(BELAJAR_AI, "bikin-aplikasi-web-dengan-ai", "Bikin Aplikasi Web dengan AI — dari Nol sampai Live"),
  agent: c(BELAJAR_AI, "orkestrasi-multi-agent", "Orkestrasi Multi-Agent untuk Proyek Nyata"),
  ide: c(KREATOR, "ide-konten", "Ide Konten Tanpa Buntu"),
  skrip: c(KREATOR, "skrip-caption", "Skrip & Caption Cepat"),
  portofolio: c(KARIER, "portofolio-dilirik", "Portofolio yang Dilirik"),
  freelance: c(KARIER, "freelance-nol", "Freelance dari Nol"),
} as const;

/** What a step builder is allowed to know. No env, no clock, no network. */
export type PlanContext = {
  answers: PetaAnswers;
  level: Level;
  /** Phrase naming the assistant to use — free tier unless they already pay. */
  tool: string;
};

export type PathPlan = {
  id: PathId;
  title: string;
  summary: string;
  communitySlug: string;
  /** Teaching order. */
  courses: readonly CourseRef[];
  steps: (ctx: PlanContext) => readonly [string, string, string];
};

export const PATHS: readonly PathPlan[] = [
  {
    id: "fondasi",
    title: "Fondasi dulu",
    summary: "Kosakata dan kebiasaan dasar, supaya sisanya tidak terasa asing.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.dasar, COURSE.prompt],
    steps: ({ tool }) => [
      `Buka "Dasar AI untuk Semua" dan selesaikan 3 materi pertama pakai ${tool}.`,
      "Tempel satu pekerjaan nyata milikmu — email, tugas kuliah, atau caption — lalu minta AI memperbaikinya. Bandingkan dengan versimu sendiri.",
      "Cari satu jawaban AI yang terdengar meyakinkan, lalu cek satu faktanya lewat pencarian biasa. Sekali kena halusinasi, kamu tidak akan lupa bentuknya.",
    ],
  },
  {
    id: "produktivitas-kerja",
    title: "Potong jam kerja",
    summary: "Pekerjaan yang kamu ulang tiap minggu, diserahkan sebagian ke AI.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.kerja, COURSE.prompt],
    steps: ({ tool }) => [
      "Tulis 3 pekerjaan yang paling sering kamu ulang. Pilih satu yang paling membosankan.",
      `Serahkan yang satu itu ke ${tool} minggu ini, untuk pekerjaan yang memang harus kamu kirim — bukan latihan.`,
      "Simpan prompt yang berhasil di catatan. Akhir minggu kamu sudah punya template, bukan cuma pengalaman.",
    ],
  },
  {
    id: "prompt-andalan",
    title: "Prompt yang bisa diandalkan",
    summary: "Dari jawaban untung-untungan jadi hasil yang konsisten tiap kali.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.prompt, COURSE.kerja],
    steps: ({ tool }) => [
      "Ambil satu prompt yang biasa kamu pakai. Tulis ulang dengan empat bagian: peran, konteks, tugas, format.",
      "Tambahkan dua contoh jawaban yang kamu mau, lalu jalankan lagi. Itu few-shot, dan bedanya biasanya kelihatan langsung.",
      `Simpan versi terbaiknya sebagai instruksi tersimpan di ${tool} supaya tidak perlu kamu ketik ulang besok.`,
    ],
  },
  {
    id: "olah-data",
    title: "Dari spreadsheet ke keputusan",
    summary: "Baca data yang sudah kamu punya, tanpa belajar rumus statistik dulu.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.data, COURSE.prompt],
    steps: ({ tool }) => [
      "Ambil satu spreadsheet yang benar-benar kamu punya. Hapus dulu nama, nomor HP, dan apa pun yang sensitif.",
      `Tempel 20 baris pertamanya ke ${tool}, minta 3 temuan dan 1 angka yang mencurigakan.`,
      "Hitung ulang satu angka itu sendiri di spreadsheet. Sekali cek cukup untuk tahu sejauh mana kamu boleh percaya.",
    ],
  },
  {
    id: "bikin-aplikasi",
    title: "Bikin yang bisa dibuka orang",
    summary: "Satu aplikasi kecil yang hidup di URL, bukan di folder.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.web, COURSE.prompt],
    steps: ({ tool }) => [
      "Tulis satu paragraf tentang aplikasi TERKECIL yang kamu mau: satu layar, satu tombol, satu hasil.",
      `Minta ${tool} membuatnya sebagai satu file HTML utuh, lalu buka file itu di browser.`,
      "Ubah satu hal yang tidak kamu suka lewat chat, bukan lewat kode. Rasakan dulu loop-nya sebelum belajar sintaksnya.",
    ],
  },
  {
    id: "multi-agent",
    title: "Jalankan beberapa agent sekaligus",
    summary: "Satu sesi tidak cukup untuk proyek nyata. Ini cara membaginya.",
    communitySlug: BELAJAR_AI,
    courses: [COURSE.agent, COURSE.web],
    steps: () => [
      "Ambil satu proyek nyata dan pecah jadi 3 tugas yang tidak menyentuh file yang sama.",
      "Tulis kontraknya dalam satu halaman: aturan main, wilayah file per pekerja, dan definisi selesai.",
      "Jalankan 2 sesi paralel dengan kontrak itu, lalu review hasilnya sendiri sebelum digabung.",
    ],
  },
  {
    id: "kreator-konten",
    title: "Konten tanpa buntu",
    summary: "Sistem ide dan skrip, supaya kamu berhenti menatap layar kosong.",
    communitySlug: KREATOR,
    courses: [COURSE.ide, COURSE.skrip],
    steps: ({ tool }) => [
      `Minta ${tool} 20 ide dari satu keluhan yang sering kamu dengar dari audiensmu. Buang 17, sisakan 3.`,
      "Tulis 5 hook untuk satu ide itu, lalu pilih yang paling bikin penasaran dalam 3 detik.",
      "Posting satu. Rencana yang tidak pernah tayang bukan rencana.",
    ],
  },
  {
    id: "karier-digital",
    title: "Karier & klien pertama",
    summary: "Bukti kerja dulu, baru lamaran. Bisa dimulai tanpa pengalaman.",
    communitySlug: KARIER,
    courses: [COURSE.portofolio, COURSE.freelance],
    steps: ({ tool }) => [
      "Pilih SATU jenis pekerjaan yang mau kamu jual. Spesifik mengalahkan serbabisa.",
      `Bikin satu studi kasus: masalah, yang kamu lakukan, hasilnya. Minta ${tool} mengauditnya sebagai calon klien yang skeptis.`,
      "Kirim 5 pesan penawaran. Balasan pertama biasanya datang dari yang kelima, bukan yang pertama.",
    ],
  },
];

export const PATH_BY_ID: ReadonlyMap<PathId, PathPlan> = new Map(PATHS.map((p) => [p.id, p]));
