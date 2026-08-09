// posts slice — default UI copy (Bahasa Indonesia; technical terms stay
// English per AGENTS.md §7). Props-driven: every surface takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
//
// Arcade voice: the feed is a cabinet marquee, not a corporate timeline —
// warm and short, never cringe.
export const POSTS_COPY = {
  // ── feed ──
  feedEyebrow: "PAPAN DISKUSI",
  feedTitle: "Diskusi",
  feedSubtitle: "Tanya, umumkan, usulkan, dan bagikan sumber belajar.",
  filterAll: "Semua",
  loadMore: "Muat lagi",
  loadingMore: "Memuat…",
  exhausted: "Sudah sampai dasar papan",
  emptyTitle: "Belum ada postingan",
  emptyHint: "Jadilah yang pertama menekan tombol start.",
  emptyFilteredTitle: "Belum ada di kategori ini",
  emptyFilteredHint: "Coba kategori lain, atau tulis yang pertama.",

  // ── kinds ──
  kindDiskusi: "Diskusi",
  kindPengumuman: "Pengumuman",
  kindUsulan: "Usulan",
  kindSumber: "Sumber",

  // ── card ──
  pinned: "Disemat",
  anonymousAuthor: "Anggota",
  like: "Suka",
  liked: "Disukai",
  likeCountLabel: "poin suka",
  commentCountLabel: "balasan",
  openPost: "Buka post",
  externalLink: "Buka tautan",
  loginToLike: "Masuk untuk menyukai",
  joinToLike: "Gabung dulu untuk menyukai",

  // ── composer ──
  composerTitle: "Tulis post",
  composerHint: "Markdown didukung. Tanpa unggahan file — pakai tautan saja.",
  fieldKind: "Kategori",
  fieldTitle: "Judul",
  titlePlaceholder: "Judul singkat dan jelas…",
  fieldBody: "Isi",
  bodyPlaceholder: "Tulis pertanyaan, pengumuman, atau catatanmu…",
  fieldLink: "Tautan (opsional)",
  linkPlaceholder: "https://…",
  fieldVideo: "ID video YouTube (opsional)",
  videoPlaceholder: "11 karakter, bukan URL penuh",
  submit: "Kirim",
  submitting: "Mengirim…",
  cancel: "Batal",
  createSuccess: "Post terkirim",
  gateTitle: "Gabung dulu untuk ikut menulis",
  gateHint: "Membaca bebas untuk siapa saja. Menulis, menyukai, dan membalas khusus anggota.",
  gateAction: "Masuk / gabung",

  // ── errors (ConvexError.code → copy; VALIDATION/RATE pakai pesan server) ──
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Post tidak ditemukan",
  errRateLimited: "Jatah post harian sudah habis — lanjut besok ya",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type PostsCopy = { [K in keyof typeof POSTS_COPY]: string };
export type PostsCopyOverride = Partial<PostsCopy>;

export function mergePostsCopy(override?: PostsCopyOverride): PostsCopy {
  return override ? { ...POSTS_COPY, ...override } : POSTS_COPY;
}
