// Starter course: "Prompt Engineering Praktis". See courseDasarAi.ts for why
// each course is its own file.
import type { SeedCourse } from "./types";

export const COURSE_PROMPT_ENGINEERING: SeedCourse = {
  slug: "prompt-engineering",
  title: "Prompt Engineering Praktis",
  description: "Teknik menyusun prompt agar AI memberi jawaban akurat, konsisten, dan sesuai kebutuhan.",
  modules: [
    {
      title: "Anatomi Prompt yang Baik",
      lessons: [
        {
          title: "Struktur prompt: peran, konteks, tugas",
          contentMd: `## Formula sederhana

1. **Peran** — "Kamu adalah editor bahasa Indonesia."
2. **Konteks** — beri latar belakang & batasan.
3. **Tugas** — apa yang diminta, sejelas mungkin.
4. **Format** — bentuk output: poin, tabel, panjang maksimal.

Prompt yang jelas menghasilkan jawaban yang jelas.`,
        },
        {
          title: "Few-shot: mengajari AI lewat contoh",
          contentMd: `## Zero-shot vs few-shot

- **Zero-shot** — langsung minta tanpa contoh.
- **Few-shot** — beri 1–3 contoh input → output; model meniru polanya.

Few-shot sangat ampuh untuk output berformat konsisten (mis. klasifikasi atau gaya penulisan tertentu).`,
        },
      ],
    },
    {
      title: "Pola Lanjutan",
      lessons: [
        {
          title: "Chain-of-thought: minta AI berpikir bertahap",
          contentMd: `## "Pikirkan langkah demi langkah"

Untuk soal logika atau hitungan, minta model menjabarkan penalaran **sebelum** memberi jawaban akhir. Ini menurunkan kesalahan.

Contoh: *"Jelaskan langkah-langkahnya dulu, baru beri jawaban akhirnya."*`,
        },
        {
          title: "Menghindari halusinasi",
          contentMd: `## Halusinasi = jawaban ngawur yang terdengar meyakinkan

Cara menekannya:

- Minta model **mengutip sumber** atau berkata "tidak tahu" bila ragu.
- Beri **konteks / data** sendiri, jangan andalkan ingatannya.
- **Verifikasi** setiap klaim penting.`,
        },
      ],
      quiz: {
        title: "Kuis: Prompt Engineering",
        passingScorePct: 70,
        questions: [
          {
            prompt: "Urutan formula prompt yang baik adalah…",
            options: [
              "Tugas → Peran → Format",
              "Peran → Konteks → Tugas → Format",
              "Format → Tugas saja",
              "Acak, tidak penting",
            ],
            correctIndex: 1,
          },
          {
            prompt: "Few-shot artinya…",
            options: [
              "Prompt tanpa contoh",
              "Memberi beberapa contoh input → output",
              "Prompt yang sangat pendek",
              "Menghapus semua konteks",
            ],
            correctIndex: 1,
            explanation: "Few-shot = memberi contoh agar model meniru polanya.",
          },
          {
            prompt: "Chain-of-thought paling berguna untuk…",
            options: ["Mempercantik teks", "Soal logika/penalaran bertahap", "Membuat gambar", "Mempercepat model"],
            correctIndex: 1,
          },
          {
            prompt: "Cara menekan halusinasi AI?",
            options: [
              "Minta model menebak sebisanya",
              "Larang model berkata 'tidak tahu'",
              "Beri konteks, minta sumber, lalu verifikasi",
              "Naikkan temperature setinggi mungkin",
            ],
            correctIndex: 2,
          },
        ],
      },
    },
  ],
};
