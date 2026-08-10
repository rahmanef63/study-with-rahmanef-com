// materi slice — Bahasa Indonesia copy (AGENTS.md §7). Props-driven defaults:
// every string a consumer might want to reword is here, not inline in JSX.

export type MateriCopy = {
  libraryTitle: string;
  libraryEyebrow: string;
  librarySubtitle: string;
  searchPlaceholder: string;
  filterAll: string;
  countSuffix: string;
  courseCountSuffix: string;
  loadMore: string;
  loadingMore: string;
  emptyLibrary: string;
  emptyTag: string;
  emptySearch: (query: string) => string;
  gateLibrary: string;
  gateMateri: string;
  draftBadge: string;
  videoBadge: string;
  tagsLabel: string;
  appearsInLabel: string;
  relatedLabel: string;
  linksHeading: string;
  backToLibrary: string;
  notFoundTitle: string;
  notFoundBody: string;
  errNotAuthenticated: string;
  errNotAuthorized: string;
  errNotFound: string;
  errUnknown: string;
  // ── sort (both libraries) ──
  sortLabel: string;
  sortNewest: string;
  sortOldest: string;
  sortTitle: string;
  /** Why A→Z only orders the page you are on — stated, never faked. */
  sortTitleNote: string;
  // ── skills ──
  skillsTitle: string;
  skillsSubtitle: string;
  skillsSearchPlaceholder: string;
  skillsCountSuffix: string;
  skillBadge: string;
  searchTooShort: string;
  emptySkillsTitle: string;
  emptySkillsWhat: string;
  emptySkillsHow: string;
  emptySkillsHowInstructor: string;
  emptySkillsCta: string;
  emptySkillsTag: string;
  emptySkillsSearch: (query: string) => string;
  gateSkills: string;
  gateSkill: string;
  backToSkills: string;
  promptHeading: string;
  promptCopy: string;
  promptCopied: string;
  promptCopyFailed: string;
  promptHint: string;
  promptMissing: string;
  skillNotFoundTitle: string;
  skillNotFoundBody: string;
};

export const MATERI_COPY: MateriCopy = {
  libraryTitle: "Materi",
  libraryEyebrow: "Perpustakaan",
  librarySubtitle: "Semua materi komunitas, terbaru dulu. Satu materi bisa dipakai di banyak kelas.",
  searchPlaceholder: "Cari materi…",
  filterAll: "Semua",
  countSuffix: "materi",
  courseCountSuffix: "kelas",
  loadMore: "Muat lebih banyak",
  loadingMore: "Memuat…",
  emptyLibrary: "Belum ada materi di komunitas ini.",
  emptyTag: "Belum ada materi dengan tag ini.",
  emptySearch: (query) => `Tidak ada materi yang cocok dengan “${query}”.`,
  gateLibrary: "Perpustakaan materi hanya terbuka untuk anggota komunitas.",
  gateMateri: "Gabung komunitasnya dulu — gratis — lalu materinya langsung kebuka 🌱",
  draftBadge: "Draf",
  videoBadge: "Video",
  tagsLabel: "Tag",
  appearsInLabel: "Muncul di kelas",
  relatedLabel: "Materi terkait",
  linksHeading: "Tautan",
  backToLibrary: "Kembali ke Materi",
  notFoundTitle: "Materi tidak ditemukan",
  notFoundBody: "Materi ini mungkin sudah dihapus, atau tautannya salah.",
  errNotAuthenticated: "Masuk dulu untuk membuka materi ini.",
  errNotAuthorized: "Materi ini hanya untuk anggota komunitas.",
  errNotFound: "Materi tidak ditemukan.",
  errUnknown: "Ada yang salah. Coba lagi sebentar lagi ya.",

  sortLabel: "Urutkan",
  sortNewest: "Terbaru",
  sortOldest: "Terlama",
  sortTitle: "A→Z",
  sortTitleNote: "A→Z mengurutkan yang sudah dimuat.",

  skillsTitle: "Skills",
  skillsSubtitle:
    "Kumpulan prompt siap pakai. Salin, tempel ke AI-nya, langsung jalan.",
  skillsSearchPlaceholder: "Cari skill atau isi prompt…",
  skillsCountSuffix: "skill",
  skillBadge: "Skill",
  searchTooShort: "Ketik minimal 2 huruf.",

  // The library ships EMPTY on purpose (prompts are seeded later), so this is
  // the first screen most people will ever see on this tab. "Belum ada" alone
  // would teach them nothing about what the tab is for.
  emptySkillsTitle: "Belum ada skill di sini",
  emptySkillsWhat:
    "Skill itu satu prompt siap pakai — plus penjelasan kapan dipakai dan contoh hasilnya. Bedanya dengan materi: materi buat dipelajari, skill buat langsung disalin ke ChatGPT, Claude, atau Gemini.",
  emptySkillsHow: "Skill ditambahkan oleh pengajar komunitas lewat menu Kelola.",
  emptySkillsHowInstructor:
    "Buka Kelola untuk menambah skill: buat materinya, lalu isi kolom Prompt — materi yang punya prompt otomatis muncul di sini.",
  emptySkillsCta: "Buka Kelola",
  emptySkillsTag: "Belum ada skill dengan tag ini.",
  emptySkillsSearch: (query) => `Tidak ada skill yang cocok dengan “${query}”.`,
  gateSkills: "Kumpulan prompt komunitas hanya terbuka untuk anggota.",
  gateSkill: "Gabung komunitasnya dulu — gratis — lalu prompt-nya langsung kebuka 🌱",
  backToSkills: "Kembali ke Skills",
  promptHeading: "Prompt",
  promptCopy: "Salin",
  promptCopied: "Prompt disalin",
  promptCopyFailed: "Gagal menyalin — blok teksnya lalu salin manual ya.",
  promptHint: "Tempel ke ChatGPT, Claude, atau Gemini. Ganti bagian dalam [kurung siku].",
  promptMissing: "Prompt-nya belum diisi.",
  skillNotFoundTitle: "Skill tidak ditemukan",
  skillNotFoundBody: "Skill ini mungkin sudah dihapus, atau tautannya salah.",
};

export type MateriCopyOverride = Partial<MateriCopy>;

export function mergeMateriCopy(override?: MateriCopyOverride): MateriCopy {
  return override === undefined ? MATERI_COPY : { ...MATERI_COPY, ...override };
}
