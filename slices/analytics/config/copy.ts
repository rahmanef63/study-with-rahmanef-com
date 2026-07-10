// analytics slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every component takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const ANALYTICS_COPY = {
  // stat cards
  statMembers: "Anggota komunitas",
  statCompletions: "Lulus kelas",
  statLessons: "Total lesson",
  // per-lesson completion section
  lessonSectionTitle: "Penyelesaian per lesson",
  lessonSectionHint: "Berapa anggota yang menandai tiap lesson selesai",
  completedSuffix: "selesai",
  emptyLessons: "Belum ada lesson di kelas ini",
  // quiz stats section
  quizSectionTitle: "Statistik kuis",
  attemptsUnit: "percobaan",
  passedUnit: "lulus",
  passRateLabel: "Tingkat kelulusan",
  emptyQuizzes: "Belum ada kuis di kelas ini",
  // errors (ConvexError.code → user copy; VALIDATION_FAILED uses server msg)
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak permintaan — coba lagi nanti",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type AnalyticsCopy = { [K in keyof typeof ANALYTICS_COPY]: string };
export type AnalyticsCopyOverride = Partial<AnalyticsCopy>;

export function mergeAnalyticsCopy(override?: AnalyticsCopyOverride): AnalyticsCopy {
  return override ? { ...ANALYTICS_COPY, ...override } : ANALYTICS_COPY;
}
