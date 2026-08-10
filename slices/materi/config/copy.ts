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
};

export type MateriCopyOverride = Partial<MateriCopy>;

export function mergeMateriCopy(override?: MateriCopyOverride): MateriCopy {
  return override === undefined ? MATERI_COPY : { ...MATERI_COPY, ...override };
}
