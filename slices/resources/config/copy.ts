// resources slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every view takes a partial override
// so the slice stays portable (no hardcoded consumer copy).
export const RESOURCES_COPY = {
  // ── resource board ──
  boardTitle: "Papan Sumber Belajar",
  boardSubtitle: "Kurasi link, artikel, dan tools dari komunitas",
  submitResourceTitle: "Bagikan sumber",
  fieldTitle: "Judul",
  fieldUrl: "URL",
  fieldNote: "Catatan (opsional)",
  titlePlaceholder: "mis. Panduan Prompt Engineering",
  urlPlaceholder: "https://",
  notePlaceholder: "Kenapa sumber ini bermanfaat?",
  submit: "Kirim",
  submitting: "Mengirim…",
  tabApproved: "Disetujui",
  tabPending: "Menunggu",
  tabMine: "Kiriman saya",
  emptyApproved: "Belum ada sumber yang disetujui",
  emptyPending: "Tidak ada yang menunggu peninjauan",
  emptyMine: "Kamu belum mengirim sumber",
  approve: "Setujui",
  reject: "Tolak",
  openLink: "Buka tautan",
  submitResourceSuccess: "Sumber terkirim — menunggu peninjauan",
  approveSuccess: "Sumber disetujui",
  rejectSuccess: "Sumber ditolak",

  // ── suggestion box ──
  boxTitle: "Kotak Usulan",
  boxSubtitle: "Usulkan kelas atau topik yang ingin kamu pelajari",
  submitSuggestionTitle: "Usulkan kelas / topik",
  fieldSuggestionTitle: "Judul usulan",
  fieldDetail: "Detail (opsional)",
  suggestionTitlePlaceholder: "mis. Kelas Fine-tuning LLM",
  detailPlaceholder: "Jelaskan usulanmu (opsional)",
  tabOpen: "Terbuka",
  tabMineSuggestion: "Usulan saya",
  emptyOpen: "Belum ada usulan terbuka",
  emptyMineSuggestion: "Kamu belum mengirim usulan",
  submitSuggestionSuccess: "Usulan terkirim",
  statusUpdateSuccess: "Status usulan diperbarui",
  voteAction: "Dukung usulan ini",
  unvoteAction: "Batalkan dukungan",
  markPlanned: "Rencanakan",
  markDone: "Tandai selesai",
  markRejectedSuggestion: "Tolak",
  reopen: "Buka lagi",

  // ── status labels (badges) ──
  statusPending: "Menunggu",
  statusApproved: "Disetujui",
  statusRejected: "Ditolak",
  statusOpen: "Terbuka",
  statusPlanned: "Direncanakan",
  statusDone: "Selesai",

  // ── errors (ConvexError.code → copy; VALIDATION_FAILED uses server msg) ──
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak kiriman menunggu — tunggu peninjauan dulu",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type ResourcesCopy = { [K in keyof typeof RESOURCES_COPY]: string };
export type ResourcesCopyOverride = Partial<ResourcesCopy>;

export function mergeResourcesCopy(override?: ResourcesCopyOverride): ResourcesCopy {
  return override ? { ...RESOURCES_COPY, ...override } : RESOURCES_COPY;
}
