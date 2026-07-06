// announcements slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every component takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const ANNOUNCEMENTS_COPY = {
  // list surface
  title: "Pengumuman",
  subtitle: "Kabar terbaru dari komunitas",
  empty: "Belum ada pengumuman",
  emptyManage: "Belum ada pengumuman — buat yang pertama di bawah",
  postedToDiscord: "Terkirim ke Discord",
  // create form
  formTitle: "Buat pengumuman",
  titleLabel: "Judul",
  titlePlaceholder: "Judul pengumuman",
  bodyLabel: "Isi",
  bodyPlaceholder: "Tulis pengumuman… (mendukung markdown)",
  submit: "Kirim pengumuman",
  submitting: "Mengirim…",
  createSuccess: "Pengumuman dikirim",
  // errors (ConvexError.code → user copy; VALIDATION_FAILED uses server msg)
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak permintaan — coba lagi nanti",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type AnnouncementsCopy = { [K in keyof typeof ANNOUNCEMENTS_COPY]: string };
export type AnnouncementsCopyOverride = Partial<AnnouncementsCopy>;

export function mergeAnnouncementsCopy(
  override?: AnnouncementsCopyOverride
): AnnouncementsCopy {
  return override ? { ...ANNOUNCEMENTS_COPY, ...override } : ANNOUNCEMENTS_COPY;
}
