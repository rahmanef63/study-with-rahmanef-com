// Budget advice. Three jobs, in order of how much they are worth to a learner:
// (1) if they said Rp0, hand back a plan that is genuinely free; (2) if they
// already pay for something, spend THAT before recommending anything new;
// (3) if they budgeted money they do not need, say so out loud. Telling
// somebody they can cancel a subscription beats every upsell we could write.
//
// Free-tier limits are described by MECHANISM, not by a number. Quotas move
// every few months and a stale "30 pesan per hari" would be a lie with a
// timestamp; "jatahnya reset tiap beberapa jam" stays true.
import { BUDGET_RANK, TIME_RANK } from "./options";
import type { PetaAnswers, Subscription } from "./types";
import type { BudgetAdvice, Level } from "./result";

const PAID_SUBS: readonly Subscription[] = ["chatgpt-plus", "claude-pro", "gemini", "other"];

export function paidSubscriptions(answers: PetaAnswers): readonly Subscription[] {
  return PAID_SUBS.filter((s) => answers.subscriptions.includes(s));
}

const SUB_LABEL: Record<Subscription, string> = {
  none: "belum langganan",
  "chatgpt-plus": "ChatGPT Plus",
  "claude-pro": "Claude Pro",
  gemini: "Gemini berbayar",
  other: "langganan AI yang kamu punya",
};

const SUB_ADVICE: Record<Subscription, string> = {
  none: "",
  "chatgpt-plus": "ChatGPT Plus sudah kamu bayar — pakai Custom Instructions dan Projects-nya. Itu fitur yang membedakannya dari versi gratis, bukan model yang lebih pintar.",
  "claude-pro": "Claude Pro sudah kamu bayar — bikin satu Project per pekerjaan rutin dan simpan konteksnya di sana. Kamu berhenti menjelaskan ulang tiap hari.",
  gemini: "Gemini berbayar sudah kamu bayar — arahkan ke Google Docs dan Sheets yang sudah kamu pakai. Di situ nilainya, bukan di kotak chatnya.",
  other: "Kamu sudah bayar satu langganan AI. Habiskan dulu fiturnya sebelum menambah yang kedua.",
};

/** The assistant the weekly steps should name. Never recommends spending. */
export function primaryTool(answers: PetaAnswers): string {
  const paid = paidSubscriptions(answers);
  if (paid.includes("claude-pro")) return "Claude Pro yang sudah kamu bayar";
  if (paid.includes("chatgpt-plus")) return "ChatGPT Plus yang sudah kamu bayar";
  if (paid.includes("gemini")) return "Gemini yang sudah kamu bayar";
  if (paid.includes("other")) return "langganan AI yang sudah kamu punya";
  return "Claude atau Gemini versi gratis";
}

function freeTiers(answers: PetaAnswers): string[] {
  const lines = [
    "Claude gratis — paling enak untuk menulis dan menyusun ulang teks. Jatah pesannya di-reset tiap beberapa jam, jadi kerjakan yang paling penting di awal sesi.",
    "ChatGPT gratis — model terbaiknya dibatasi, lalu otomatis turun ke model yang lebih ringan. Tetap cukup untuk meringkas dan menyusun draf.",
    "Gemini gratis — jatahnya paling longgar untuk dokumen panjang, dan nyambung ke Google Docs/Sheets yang mungkin sudah kamu pakai tiap hari.",
  ];
  if (answers.goal === "build-app" || answers.role === "developer") {
    lines.push(
      "Google AI Studio — coba API tanpa kartu kredit. Wajar untuk belajar dan bikin purwarupa; bukan untuk aplikasi yang dipakai banyak orang.",
    );
  }
  if (answers.goal === "work-with-data" || answers.role === "analyst") {
    lines.push("Google Sheets + Gemini gratis sudah cukup untuk seluruh kelas analisis data di sini. Tidak ada bagian yang menuntut tool berbayar.");
  }
  lines.push("Batas gratisan berubah tiap beberapa bulan. Anggap ini arah, bukan janji — kalau mentok dua minggu berturut-turut, baru pikirkan bayar.");
  return lines;
}

function savingsFor(answers: PetaAnswers, level: Level): string[] {
  const out: string[] = [];
  const paid = paidSubscriptions(answers);
  if (paid.length >= 2) {
    out.push(
      `Kamu bayar ${paid.length} langganan sekaligus (${paid.map((s) => SUB_LABEL[s]).join(", ")}). Untuk beban belajarmu sekarang, satu sudah lebih dari cukup — hentikan yang paling jarang kamu buka.`,
    );
  }
  if (BUDGET_RANK[answers.budget] >= 3 && (level === "pemula" || level === "terbiasa")) {
    out.push(
      "Kamu siap keluar di atas Rp300rb, tapi di tahap ini uang bukan pengungkitnya — yang kurang jam terbang, bukan tool. Tahan dulu anggarannya.",
    );
  }
  if (BUDGET_RANK[answers.budget] >= 1 && paid.length === 0 && level !== "lanjut") {
    out.push("Kamu belum langganan apa pun dan memang belum perlu bulan ini. Semua yang kami sarankan minggu ini jalan di versi gratis.");
  }
  if (BUDGET_RANK[answers.budget] >= 1 && TIME_RANK[answers.weeklyTime] === 0) {
    out.push("Dengan kurang dari 1 jam per minggu, langganan berbayar hampir pasti tidak balik modal. Tambah jamnya dulu, baru tambah biayanya.");
  }
  return out;
}

function paidFor(answers: PetaAnswers, level: Level): string[] {
  if (answers.budget === "zero") return [];
  const out: string[] = [];
  const paid = paidSubscriptions(answers);
  if (paid.length === 0 && (level === "menengah" || level === "lanjut")) {
    out.push(
      "Satu langganan chat saja (Claude Pro atau ChatGPT Plus, kisaran Rp250–300rb/bulan). Yang kamu beli sebenarnya Projects dan instruksi tersimpan, bukan model yang lebih pintar.",
    );
  }
  if (BUDGET_RANK[answers.budget] >= 2 && (answers.goal === "build-app" || answers.role === "developer")) {
    out.push(
      "Kalau sudah mulai memanggil API: biayanya per token, bukan per bulan. Mulai dari model termurah, pasang batas pemakaian di dashboard sejak hari pertama.",
    );
  }
  if (out.length === 0) {
    out.push("Belum ada yang perlu kamu beli untuk rencana ini. Simpan anggarannya sampai kamu benar-benar mentok di versi gratis.");
  }
  return out;
}

function headlineFor(answers: PetaAnswers, level: Level, paidCount: number): string {
  if (paidCount > 0 && answers.budget === "zero") return "Tidak perlu tambah biaya — habiskan dulu langganan yang sudah kamu bayar.";
  if (paidCount > 0) return "Sebelum beli apa pun, pakai dulu yang sudah kamu bayar tiap bulan.";
  if (answers.budget === "zero") return "Rencana kamu 100% gratis. Tidak ada satu langkah pun yang butuh kartu kredit.";
  if (BUDGET_RANK[answers.budget] >= 3 && level !== "lanjut") return "Anggaranmu lebih besar dari kebutuhanmu. Itu kabar bagus — simpan saja.";
  return "Mulai dari gratis. Bayar hanya kalau kamu sudah mentok, bukan sebelumnya.";
}

export function budgetAdvice(answers: PetaAnswers, level: Level): BudgetAdvice {
  const paid = paidSubscriptions(answers);
  return {
    headline: headlineFor(answers, level, paid.length),
    free: freeTiers(answers),
    paid: paidFor(answers, level),
    savings: savingsFor(answers, level),
    useWhatYouPayFor: paid.map((s) => SUB_ADVICE[s]),
  };
}
