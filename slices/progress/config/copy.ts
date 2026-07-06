// progress slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every component takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const PROGRESS_COPY = {
  // lesson player — completion button / chip
  markComplete: "Tandai selesai",
  marking: "Menyimpan…",
  completed: "Selesai",
  markCompleteSuccess: "Lesson ditandai selesai",
  courseCompleteSuccess: "Selamat! Kamu menyelesaikan kelas ini",
  // course overview — progress bar
  progressTitle: "Progres kelas",
  lessonsUnit: "lesson",
  completedSuffix: "selesai",
  courseCompleteBadge: "Kelas selesai",
  emptyProgress: "Belum ada lesson di kelas ini",
  // errors (ConvexError.code → user copy; VALIDATION_FAILED uses server msg)
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak permintaan — coba lagi nanti",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type ProgressCopy = { [K in keyof typeof PROGRESS_COPY]: string };
export type ProgressCopyOverride = Partial<ProgressCopy>;

export function mergeProgressCopy(override?: ProgressCopyOverride): ProgressCopy {
  return override ? { ...PROGRESS_COPY, ...override } : PROGRESS_COPY;
}
