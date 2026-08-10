// Extra community: "Kreator Konten bareng Rahman".
import type { SeedCommunity } from "./types";

export const COMMUNITY_KREATOR_KONTEN: SeedCommunity = {
  slug: "kreator-konten",
  name: "Kreator Konten AI",
  description:
    "Bikin konten konsisten pakai bantuan AI — ide, skrip, dan caption tanpa buntu.",
  track: "konten",
  courses: [
    {
      slug: "ide-konten",
      title: "Ide Konten Tanpa Buntu",
      description: "Sistem sederhana biar nggak pernah kehabisan ide.",
      modules: [
        {
          title: "Sistem Ide",
          lessons: [
            {
              title: "Pancing ide dengan AI",
              contentMd: `## AI = partner brainstorming

Jangan cuma minta "kasih ide konten". Beri konteks: audiens, niche, tujuan.

Contoh prompt: *"10 ide Reels untuk pemula belajar AI, format tips singkat, gaya santai."*

AI memancing, **kamu yang menyaring** sesuai selera.`,
            },
            {
              title: "Kalender konten 30 hari",
              contentMd: `## Batch, jangan harian

Sisihkan 1 hari untuk merencanakan 30 hari. Pilih 3–4 **pilar konten** lalu rotasi:

- Edukasi · Cerita · Promosi · Interaksi

Konsistensi mengalahkan viral sesekali.`,
            },
          ],
          quiz: {
            title: "Kuis: Ide Konten",
            passingScorePct: 60,
            questions: [
              { prompt: "Prompt ide yang baik memberi AI…", options: ["Satu kata", "Konteks: audiens/niche/tujuan", "Hanya emoji", "Tanpa arahan"], correctIndex: 1 },
              { prompt: "Cara menjaga konsistensi konten?", options: ["Bikin harian dadakan", "Batch & pakai pilar konten", "Tunggu mood", "Hanya pas viral"], correctIndex: 1 },
            ],
          },
        },
      ],
    },
    {
      slug: "skrip-caption",
      title: "Skrip & Caption Cepat",
      description: "Nulis hook & caption yang ngajak aksi, cepat.",
      modules: [
        {
          title: "Nulis Cepat",
          lessons: [
            {
              title: "Rumus hook 3 detik",
              contentMd: `## 3 detik pertama menentukan

Hook = **janji + rasa penasaran.**

Pola: *"Berhenti lakukan X"*, *"3 kesalahan Y"*, *"Cara Z tanpa W"*.

Uji beberapa hook, pertahankan yang paling menahan tontonan.`,
            },
            {
              title: "Caption yang ngajak aksi",
              contentMd: `## Struktur caption

1. **Hook** (baris pertama).
2. **Nilai** (1–3 poin).
3. **CTA** (komentar / simpan / bagikan).

Cukup **satu ajakan** per caption.`,
            },
          ],
          quiz: {
            title: "Kuis: Skrip & Caption",
            passingScorePct: 60,
            questions: [
              { prompt: "Hook yang kuat berisi…", options: ["Salam panjang", "Janji + rasa penasaran", "Deretan hashtag", "Tag teman"], correctIndex: 1 },
              { prompt: "Caption sebaiknya punya berapa CTA utama?", options: ["Sebanyak mungkin", "Satu", "Nol", "Lima"], correctIndex: 1 },
            ],
          },
        },
      ],
    },
  ],
  welcome: {
    title: "Selamat datang di Kreator Konten AI! 🎬",
    bodyMd: `Buat kamu yang bikin konten: **ide, skrip, caption** jadi lebih cepat dengan AI.

- **Ide Konten Tanpa Buntu** — sistem ide 30 hari.
- **Skrip & Caption Cepat** — hook & CTA yang bekerja.

Selamat berkarya!`,
  },
  sumber: [
    { title: "Bank hook siap pakai", url: "https://claude.ai", note: "Minta variasi hook ke Claude pakai konteksmu." },
  ],
};
