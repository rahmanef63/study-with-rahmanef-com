// Starter course: "Dasar AI untuk Semua". One course per file — adding a class
// is then a new file plus one line in coursesData.ts, not a diff in the middle
// of a 200-line array.
//
// FLAT list of materi (DECISIONS #37): the "Mengenal AI & LLM" / "Pakai AI
// Sehari-hari" module headings are gone, their lessons concatenated in the
// order a learner already saw them, and the quiz moved onto the course.
import type { SeedCourse } from "./types";

export const COURSE_DASAR_AI: SeedCourse = {
  slug: "dasar-ai",
  title: "Dasar AI untuk Semua",
  description:
    "Pahami AI, machine learning, dan LLM dari nol — tanpa jargon, langsung ke praktik sehari-hari.",
  lessons: [
    {
      title: "Apa itu AI, ML, dan LLM?",
      contentMd: `## Tiga istilah yang sering tertukar

- **AI (Artificial Intelligence)** — payung besar: sistem yang meniru kemampuan berpikir manusia.
- **ML (Machine Learning)** — cara AI belajar dari data, bukan diprogram aturan satu per satu.
- **LLM (Large Language Model)** — model ML raksasa yang dilatih pada teks. Contohnya Claude dan GPT.

Analogi: AI itu "kendaraan", ML itu "mesinnya", LLM itu "mobil balap khusus bahasa".

## Kenapa LLM terasa pintar?

LLM belajar pola dari miliaran kalimat, lalu memprediksi kata berikutnya yang paling masuk akal. Ia tidak "tahu" fakta seperti database — ia **memperkirakan**.

> Ingat: LLM bisa salah dengan percaya diri. Selalu verifikasi hal penting.`,
      links: [{ label: "Coba Claude gratis", url: "https://claude.ai" }],
    },
    {
      title: "Bagaimana LLM 'berpikir'",
      contentMd: `## Token, bukan kata

LLM memecah teks jadi potongan kecil bernama **token**, memprosesnya, lalu memprediksi token berikutnya.

## Context window

Model punya "ingatan kerja" terbatas — jumlah token yang bisa dibaca sekaligus. Percakapan yang sangat panjang bisa membuat bagian awal seperti "terlupa".

## Temperature (suhu)

Parameter yang mengatur kreativitas jawaban:

- **rendah** → aman & konsisten
- **tinggi** → lebih variatif, tapi lebih berisiko ngawur`,
    },
    {
      title: "Alat AI populer & kegunaannya",
      contentMd: `## Peta alat

- **Chat / asisten** — Claude, ChatGPT: menulis, meringkas, brainstorming, analisis.
- **Gambar** — Midjourney, DALL·E: ilustrasi & konsep visual.
- **Kode** — Claude Code, Copilot: membantu ngoding.

## Tips memilih

Cocokkan alat dengan tugasnya. Untuk teks & analisis, asisten chat sudah sangat kuat dan jadi titik awal terbaik.`,
      links: [{ label: "Claude", url: "https://claude.ai" }],
    },
    {
      title: "Etika & batasan AI",
      contentMd: `## Yang perlu dijaga

- **Privasi** — jangan tempel data sensitif atau rahasia ke AI publik.
- **Hak cipta** — hasil AI bisa mirip karya lain; cek sebelum dipakai komersial.
- **Bias** — AI mewarisi bias dari data latihnya.
- **Verifikasi** — untuk keputusan penting (medis, hukum, keuangan), AI itu asisten, bukan penentu akhir.`,
    },
  ],
  quizzes: [
    {
      title: "Kuis: Dasar AI",
      passingScorePct: 60,
      questions: [
        {
          prompt: "Apa kepanjangan dari LLM?",
          options: ["Large Language Model", "Long Learning Machine", "Linked Logic Model", "Low-Level Memory"],
          correctIndex: 0,
          explanation: "LLM = Large Language Model — model bahasa berukuran besar.",
        },
        {
          prompt: "LLM menghasilkan jawaban terutama dengan cara…",
          options: [
            "Mencari di database fakta",
            "Memprediksi token berikutnya dari pola",
            "Menyalin dari Wikipedia",
            "Bertanya ke operator manusia",
          ],
          correctIndex: 1,
          explanation: "LLM memprediksi token paling mungkin, bukan mengambil dari database.",
        },
        {
          prompt: "Mana pernyataan yang PALING tepat tentang LLM?",
          options: ["Selalu akurat", "Tak pernah salah", "Bisa salah dengan percaya diri", "Tak perlu diverifikasi"],
          correctIndex: 2,
          explanation: "Karena memperkirakan, LLM bisa keliru meski terdengar meyakinkan.",
        },
        {
          prompt: "'Context window' artinya…",
          options: ["Ukuran layar", "Batas token yang bisa diproses sekaligus", "Jenis kata", "Nama aplikasi"],
          correctIndex: 1,
        },
      ],
    },
  ],
};
