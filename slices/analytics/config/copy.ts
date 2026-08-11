// analytics slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every component takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const ANALYTICS_COPY = {
  // stat cards
  statMembers: "Anggota komunitas",
  statCompletions: "Lulus kelas",
  statLessons: "Total materi",
  // per-materi completion section (flat — no module grouping, DECISIONS #37)
  lessonSectionTitle: "Penyelesaian per materi",
  lessonSectionHint: "Berapa anggota yang menandai tiap materi selesai, urut sesuai kelas ini",
  completedSuffix: "selesai",
  emptyLessons: "Belum ada materi di kelas ini",
  // quiz stats section
  quizSectionTitle: "Statistik kuis",
  attemptsUnit: "percobaan",
  passedUnit: "lulus",
  passRateLabel: "Tingkat kelulusan",
  emptyQuizzes: "Belum ada kuis di kelas ini",
  // ---- reader counts (insight feature, 0.3.0) ------------------------------
  // THE LABEL THAT MUST NEVER BE DROPPED. An instructor who reads "dibaca 12"
  // as twelve visitors will conclude the wrong thing about every number on this
  // screen. Anonymous reads — the etalase, search-engine arrivals, every shared
  // permalink opened by someone logged out — are not counted at all.
  membersOnlyBadge: "Anggota saja",
  membersOnlyNote:
    "Angka baca di halaman ini hanya menghitung ANGGOTA yang login. Pengunjung anonim, tautan yang dibuka orang luar, dan trafik dari Google tidak masuk hitungan. Satu anggota dihitung sekali per materi per hari.",
  // drop-off
  funnelSectionTitle: "Di mana orang berhenti",
  funnelSectionHint:
    "Materi urut sesuai kelas ini. Yang dicari bukan totalnya — tapi baris tempat angkanya jatuh.",
  funnelChartLabel: "Grafik sisa pembaca per materi",
  dropHeadline: "Paling banyak berhenti di sini",
  dropNobody: "Belum ada penurunan yang menonjol",
  dropNobodyHint: "Belum cukup data — atau semua yang mulai masih jalan terus.",
  dropLostUnit: "orang berhenti",
  startedLabel: "Mulai (buka materi pertama)",
  reachedEndLabel: "Sampai materi terakhir",
  readersUnit: "pembaca",
  rereadUnit: "kali baca",
  emptyFunnel: "Belum ada yang membuka materi di kelas ini",
  // community pulse
  pulseSectionTitle: "Denyut komunitas",
  pulseActiveWeek: "Aktif minggu ini",
  pulseCompletionsWeek: "Selesai minggu ini",
  pulseCompletionsTotal: "Total materi diselesaikan",
  pulseNeverRead: "Materi belum pernah dibuka",
  pulseMostRead: "Paling sering dibuka",
  pulseLeastRead: "Paling jarang dibuka",
  pulseNeverReadHint: "Ini yang paling layak dibenahi judul atau penempatannya.",
  emptyPulseMateri: "Belum ada materi di komunitas ini",
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
