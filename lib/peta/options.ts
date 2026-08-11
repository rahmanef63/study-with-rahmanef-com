// Every answer option, with its Bahasa Indonesia label. Separated from
// questions.ts so the scorer can cite a label ("kamu kerja di marketing")
// without importing the question feed, and so the exhaustive test can walk the
// full answer space by reading these arrays instead of hardcoding literals.
import type { Budget, Goal, PetaOption, Role, Subscription, Tenure, WeeklyTime } from "./types";

export const TENURE_OPTIONS: readonly PetaOption<Tenure>[] = [
  { value: "never", label: "Belum pernah", hint: "Baru mau mulai" },
  { value: "under3m", label: "Kurang dari 3 bulan" },
  { value: "3to12m", label: "3–12 bulan" },
  { value: "over1y", label: "Lebih dari 1 tahun" },
];

export const ROLE_OPTIONS: readonly PetaOption<Role>[] = [
  { value: "student", label: "Pelajar / mahasiswa" },
  { value: "teacher", label: "Guru / pengajar" },
  { value: "office", label: "Staf kantor" },
  { value: "marketing", label: "Marketing / konten" },
  { value: "analyst", label: "Analis data" },
  { value: "business-owner", label: "Pemilik usaha / UMKM" },
  { value: "developer", label: "Developer" },
  { value: "unemployed", label: "Belum bekerja" },
  { value: "other", label: "Lainnya" },
];

export const GOAL_OPTIONS: readonly PetaOption<Goal>[] = [
  { value: "save-time", label: "Hemat waktu", hint: "Kerjaan yang itu-itu terus" },
  { value: "make-content", label: "Bikin konten" },
  { value: "work-with-data", label: "Olah data" },
  { value: "build-app", label: "Bikin aplikasi" },
  { value: "career", label: "Naikkan karier / cari klien" },
  { value: "curious", label: "Penasaran saja" },
];

export const BUDGET_OPTIONS: readonly PetaOption<Budget>[] = [
  { value: "zero", label: "Rp0", hint: "Gratis saja dulu" },
  { value: "under100k", label: "Di bawah Rp100rb" },
  { value: "100to300k", label: "Rp100rb–300rb" },
  { value: "over300k", label: "Di atas Rp300rb" },
];

export const SUBSCRIPTION_OPTIONS: readonly PetaOption<Subscription>[] = [
  { value: "none", label: "Belum langganan apa pun" },
  { value: "chatgpt-plus", label: "ChatGPT Plus" },
  { value: "claude-pro", label: "Claude Pro" },
  { value: "gemini", label: "Gemini berbayar" },
  { value: "other", label: "Lainnya" },
];

export const WEEKLY_TIME_OPTIONS: readonly PetaOption<WeeklyTime>[] = [
  { value: "under1h", label: "Kurang dari 1 jam" },
  { value: "1to3h", label: "1–3 jam" },
  { value: "3to7h", label: "3–7 jam" },
  { value: "over7h", label: "Lebih dari 7 jam" },
];

/** Phrases the reason-writer drops straight into a sentence after "kamu …". */
export const ROLE_PHRASE: Record<Role, string> = {
  student: "masih sekolah atau kuliah",
  teacher: "mengajar",
  office: "kerja kantoran",
  marketing: "kerja di marketing/konten",
  analyst: "kerja dengan data",
  "business-owner": "punya usaha sendiri",
  developer: "seorang developer",
  unemployed: "belum bekerja",
  other: "punya pekerjaan di luar daftar kami",
};

export const GOAL_PHRASE: Record<Goal, string> = {
  "save-time": "mau hemat waktu",
  "make-content": "mau bikin konten",
  "work-with-data": "mau olah data",
  "build-app": "mau bikin aplikasi",
  career: "mengejar karier atau klien",
  curious: "sekadar penasaran",
};

export const TENURE_PHRASE: Record<Tenure, string> = {
  never: "belum pernah pakai AI",
  under3m: "baru pakai AI kurang dari 3 bulan",
  "3to12m": "sudah 3–12 bulan pakai AI",
  over1y: "sudah lebih dari setahun pakai AI",
};

export const TIME_PHRASE: Record<WeeklyTime, string> = {
  under1h: "punya kurang dari 1 jam per minggu",
  "1to3h": "punya 1–3 jam per minggu",
  "3to7h": "punya 3–7 jam per minggu",
  over7h: "punya lebih dari 7 jam per minggu",
};

export const BUDGET_PHRASE: Record<Budget, string> = {
  zero: "memilih Rp0 per bulan",
  under100k: "menyiapkan di bawah Rp100rb per bulan",
  "100to300k": "menyiapkan Rp100rb–300rb per bulan",
  over300k: "menyiapkan di atas Rp300rb per bulan",
};

/** Ordinal helpers — the ONLY place tenure/budget/time become numbers. */
export const TENURE_RANK: Record<Tenure, 0 | 1 | 2 | 3> = {
  never: 0,
  under3m: 1,
  "3to12m": 2,
  over1y: 3,
};

export const BUDGET_RANK: Record<Budget, 0 | 1 | 2 | 3> = {
  zero: 0,
  under100k: 1,
  "100to300k": 2,
  over300k: 3,
};

export const TIME_RANK: Record<WeeklyTime, 0 | 1 | 2 | 3> = {
  under1h: 0,
  "1to3h": 1,
  "3to7h": 2,
  over7h: 3,
};
