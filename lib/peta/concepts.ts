// The stage-3 swipe deck, and where each concept is actually taught.
//
// The community slugs below are DATA, not config: these materi live in the
// `belajar-ai` tenant because that is the tenant every flagship seed writes to
// (`convex/seed*.ts`). `DEFAULT_COMMUNITY_SLUG` is deliberately NOT imported —
// it is env-driven, and reading env would make this engine non-deterministic.
//
// `materi: null` means the platform does not teach that concept yet. That is
// left honest on purpose: a gap pointing at a materi that does not cover it is
// worse than a gap that says "belum ada". The four nulls here ARE the content
// backlog (api · rag · mcp · fine-tuning).
import type { ConceptCard, ConceptId, ConceptTier } from "./types";
import type { MateriRef } from "./result";

const FLAGSHIP = "belajar-ai";

const materi = (courseSlug: string, materiSlug: string, title: string): MateriRef => ({
  communitySlug: FLAGSHIP,
  courseSlug,
  materiSlug,
  title,
});

/** Slugs verified against the seed titles via `baseSlug` (courses/slug.ts). */
export const CONCEPT_MATERI: Record<ConceptId, MateriRef | null> = {
  prompt: materi("prompt-engineering", "struktur-prompt-peran-konteks-tugas", "Struktur prompt: peran, konteks, tugas"),
  hallucination: materi("dasar-ai", "halusinasi-kenapa-terjadi-dan-cara-mengeceknya", "Halusinasi: kenapa terjadi dan cara mengeceknya"),
  "context-window": materi("dasar-ai", "bagaimana-llm-berpikir", "Bagaimana LLM 'berpikir'"),
  "data-privacy": materi("dasar-ai", "yang-tidak-boleh-kamu-tempel-ke-chatbot", "Yang tidak boleh kamu tempel ke chatbot"),
  "few-shot": materi("prompt-engineering", "contoh-yang-benar-few-shot-untuk-hasil-konsisten", "Contoh yang benar: few-shot untuk hasil konsisten"),
  "chain-of-thought": materi("prompt-engineering", "chain-of-thought-minta-ai-berpikir-bertahap", "Chain-of-thought: minta AI berpikir bertahap"),
  projects: materi("prompt-engineering", "membangun-prompt-andalanmu-sendiri", "Membangun prompt andalanmu sendiri"),
  api: null,
  "token-cost": materi("orkestrasi-multi-agent", "batas-satu-sesi-context-window-fokus", "Batas Satu Sesi: Context Window & Fokus"),
  rag: null,
  agent: materi("bikin-aplikasi-web-dengan-ai", "dari-chat-ke-agent-apa-itu-harness", "Dari chat ke agent: apa itu harness"),
  mcp: null,
  "fine-tuning": null,
};

/** Deck order IS swipe order: easiest first, so nobody stalls on card one. */
export const CONCEPTS: readonly ConceptCard[] = [
  {
    id: "prompt",
    tier: "dasar",
    title: "Prompt",
    blurb: "Perintah yang kamu ketik ke AI — dan kenapa cara menulisnya menentukan hasilnya.",
    reveal: "Prompt bukan pertanyaan biasa. Sebut peran, konteks, dan bentuk jawaban yang kamu mau.",
  },
  {
    id: "hallucination",
    tier: "dasar",
    title: "Halusinasi",
    blurb: "Saat AI menjawab dengan yakin tapi isinya karangan.",
    reveal: "AI menebak kata berikutnya, bukan mengingat fakta. Angka, nama, dan kutipan wajib kamu cek sendiri.",
  },
  {
    id: "context-window",
    tier: "dasar",
    title: "Jendela konteks",
    blurb: "Batas seberapa banyak teks yang muat dalam satu percakapan.",
    reveal: "Kalau obrolan kepanjangan, bagian awal terlupakan. Mulai chat baru dan tempel ulang yang penting.",
  },
  {
    id: "data-privacy",
    tier: "dasar",
    title: "Privasi data",
    blurb: "Apa yang aman dan tidak aman kamu tempel ke chatbot.",
    reveal: "Jangan tempel KTP, data gaji, kontrak klien, atau data pelanggan. Samarkan dulu, baru tanya.",
  },
  {
    id: "few-shot",
    tier: "menengah",
    title: "Few-shot",
    blurb: "Memberi 2–3 contoh jawaban yang kamu mau, supaya AI menirunya.",
    reveal: "Contoh mengalahkan penjelasan. Dua contoh bagus lebih ampuh daripada satu paragraf instruksi.",
  },
  {
    id: "chain-of-thought",
    tier: "menengah",
    title: "Chain-of-thought",
    blurb: "Meminta AI menguraikan langkahnya sebelum menyimpulkan.",
    reveal: "Untuk hitungan dan penalaran, minta langkahnya dulu. Jawaban langsung lebih sering meleset.",
  },
  {
    id: "projects",
    tier: "menengah",
    title: "Projects & instruksi tersimpan",
    blurb: "Menyimpan konteks sekali, lalu dipakai ulang tiap chat baru.",
    reveal: "Fitur ini ada di Claude dan ChatGPT. Sekali isi, kamu berhenti menjelaskan dirimu tiap hari.",
  },
  {
    id: "api",
    tier: "lanjut",
    title: "API",
    blurb: "Memanggil model dari kode, bukan dari kotak chat.",
    reveal: "API membuat AI jadi bagian aplikasimu. Dibayar per pemakaian, bukan per bulan.",
  },
  {
    id: "token-cost",
    tier: "lanjut",
    title: "Token & biaya",
    blurb: "Satuan hitung teks yang menentukan tagihan dan batas panjang.",
    reveal: "Teks dipecah jadi token. Semakin panjang konteks yang kamu kirim, semakin mahal tiap panggilan.",
  },
  {
    id: "rag",
    tier: "lanjut",
    title: "RAG",
    blurb: "Menyuapi AI dokumenmu sendiri supaya jawabannya berdasar sumbermu.",
    reveal: "Dokumen dicari dulu, potongannya ditempel ke prompt. Itu sebabnya jawabannya bisa mengutip sumber.",
  },
  {
    id: "agent",
    tier: "lanjut",
    title: "Agent",
    blurb: "AI yang boleh menjalankan alat sendiri, bukan cuma membalas teks.",
    reveal: "Agent bisa baca file, jalankan perintah, dan mengulang sampai tugas selesai — dengan batas yang kamu pasang.",
  },
  {
    id: "mcp",
    tier: "lanjut",
    title: "MCP",
    blurb: "Cara standar menyambungkan AI ke alat dan datamu.",
    reveal: "Satu sambungan dipakai banyak aplikasi, jadi kamu tidak menulis integrasi baru tiap ganti tool.",
  },
  {
    id: "fine-tuning",
    tier: "lanjut",
    title: "Fine-tuning",
    blurb: "Melatih ulang model dengan datamu sendiri.",
    reveal: "Hampir selalu belum perlu. Prompt yang rapi dan contoh yang baik menyelesaikan 90% kasus, gratis.",
  },
];

const BY_ID = new Map<ConceptId, ConceptCard>(CONCEPTS.map((c) => [c.id, c]));

export function conceptById(id: ConceptId): ConceptCard | undefined {
  return BY_ID.get(id);
}

export function conceptsInTier(tier: ConceptTier): readonly ConceptCard[] {
  return CONCEPTS.filter((c) => c.tier === tier);
}

/** Why closing this gap matters, second person. Used by the result screen. */
export const CONCEPT_WHY: Record<ConceptId, string> = {
  prompt: "Ini pengungkit terbesarmu: prompt yang rapi mengubah jawaban asal-asalan jadi jawaban yang bisa langsung kamu pakai.",
  hallucination: "Tanpa ini kamu berisiko meneruskan angka karangan ke atasan atau klien.",
  "context-window": "Ini penyebab paling sering AI 'tiba-tiba lupa' di tengah kerjaanmu.",
  "data-privacy": "Sekali data sensitif tertempel, kamu tidak bisa menariknya kembali.",
  "few-shot": "Cara tercepat membuat hasil AI konsisten dengan gayamu, tanpa alat tambahan.",
  "chain-of-thought": "Kalau kamu pernah dapat hitungan yang salah dari AI, biasanya ini obatnya.",
  projects: "Kamu berhenti mengetik ulang konteks yang sama setiap hari.",
  api: "Selama masih di kotak chat, kamu tidak bisa membuat sesuatu yang jalan sendiri.",
  "token-cost": "Ini yang membedakan tagihan Rp20rb dan Rp2 juta di proyek yang sama.",
  rag: "Kunci supaya AI menjawab dari dokumenmu, bukan dari tebakan umum.",
  agent: "Batas antara 'AI membantuku mengetik' dan 'AI mengerjakan langkahnya'.",
  mcp: "Menghemat waktumu saat menyambungkan AI ke alat yang sudah kamu pakai.",
  "fine-tuning": "Penting supaya kamu tahu kapan TIDAK perlu melakukannya — itu menghemat banyak uang.",
};
