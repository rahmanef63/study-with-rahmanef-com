// comments slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every surface takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const COMMENTS_COPY = {
  // ── section ──
  sectionTitle: "Diskusi",
  sectionSubtitle: "Tanya, jawab, dan berbagi catatan tentang lesson ini",

  // ── form ──
  fieldBody: "Komentar",
  bodyPlaceholder: "Tulis pertanyaan atau catatanmu…",
  replyPlaceholder: "Tulis balasanmu…",
  submit: "Kirim",
  submitting: "Mengirim…",
  cancel: "Batal",

  // ── thread ──
  reply: "Balas",
  replies: "balasan",
  deletedPlaceholder: "Komentar ini sudah dihapus",
  anonymousAuthor: "Anggota",
  emptyTitle: "Belum ada diskusi di lesson ini",
  emptyHint: "Jadilah yang pertama bertanya atau berbagi catatan",

  // ── delete ──
  delete: "Hapus",
  deleteConfirmTitle: "Hapus komentar?",
  deleteConfirmBody:
    "Komentar akan diganti placeholder dan tidak bisa dikembalikan. Balasan di bawahnya tetap tampil.",
  deleteConfirm: "Ya, hapus",
  deleteSuccess: "Komentar dihapus",
  addSuccess: "Komentar terkirim",

  // ── errors (ConvexError.code → copy; VALIDATION/RATE pakai pesan server) ──
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak komentar — lanjutkan di Discord ya",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type CommentsCopy = { [K in keyof typeof COMMENTS_COPY]: string };
export type CommentsCopyOverride = Partial<CommentsCopy>;

export function mergeCommentsCopy(override?: CommentsCopyOverride): CommentsCopy {
  return override ? { ...COMMENTS_COPY, ...override } : COMMENTS_COPY;
}
