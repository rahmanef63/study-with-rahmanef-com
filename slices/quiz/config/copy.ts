// quiz slice — default UI copy (Bahasa Indonesia, technical terms stay English
// per AGENTS.md §7). Props-driven: every view accepts a partial override so the
// slice stays portable (no hardcoded consumer copy).
export const QUIZ_COPY = {
  // taking surface
  quizTitle: "Kuis",
  noQuiz: "Belum ada kuis untuk modul ini",
  startHint: "Jawab semua soal lalu kirim untuk melihat nilaimu.",
  question: "Soal",
  of: "dari",
  passingScore: "Nilai lulus",
  submit: "Kirim jawaban",
  submitting: "Menilai…",
  answerAllFirst: "Jawab semua soal dulu sebelum mengirim",
  answered: "terjawab",
  yourScore: "Nilaimu",
  passed: "Lulus",
  failed: "Belum lulus",
  correctCount: "Jawaban benar",
  retry: "Coba lagi",
  reviewAnswers: "Pembahasan",
  yourAnswer: "Jawabanmu",
  correctAnswer: "Jawaban benar",
  explanation: "Penjelasan",
  correct: "Benar",
  incorrect: "Salah",
  previousAttempts: "Percobaan sebelumnya",
  attemptScore: "Nilai",
  // builder surface
  builderTitle: "Buat / Ubah Kuis",
  fieldTitle: "Judul kuis",
  fieldPassing: "Nilai kelulusan (%)",
  addQuestion: "Tambah soal",
  removeQuestion: "Hapus soal",
  fieldPrompt: "Pertanyaan",
  option: "Pilihan",
  addOption: "Tambah pilihan",
  removeOption: "Hapus pilihan",
  markCorrect: "Tandai sebagai kunci jawaban",
  correctKey: "Kunci",
  fieldExplanation: "Penjelasan (opsional)",
  save: "Simpan kuis",
  saving: "Menyimpan…",
  saveSuccess: "Kuis tersimpan",
  deleteQuiz: "Hapus kuis",
  deleteConfirmTitle: "Hapus kuis ini?",
  deleteConfirmBody: "Aksi ini tidak bisa dibatalkan. Kuis yang sudah pernah dikerjakan tidak bisa dihapus.",
  deleteConfirm: "Ya, hapus",
  deleted: "Kuis dihapus",
  cancel: "Batal",
  // errors (ConvexError.code → user copy; VALIDATION_FAILED uses server msg)
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Kuis tidak ditemukan",
  errRateLimited: "Terlalu banyak permintaan — coba lagi nanti",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type QuizCopy = { [K in keyof typeof QUIZ_COPY]: string };
export type QuizCopyOverride = Partial<QuizCopy>;

export function mergeQuizCopy(override?: QuizCopyOverride): QuizCopy {
  return override ? { ...QUIZ_COPY, ...override } : QUIZ_COPY;
}
