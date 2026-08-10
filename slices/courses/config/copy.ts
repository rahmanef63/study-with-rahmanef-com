// courses slice — default UI copy (Bahasa Indonesia, technical terms stay
// English per AGENTS.md §7). Props-driven: every component accepts a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const COURSES_COPY = {
  // member surface
  courses: "Kelas",
  lessons: "Materi",
  syllabus: "Silabus",
  quizzes: "Kuis",
  emptyCatalog: "Belum ada kelas yang terbit di komunitas ini",
  emptySyllabus: "Silabus belum diisi",
  lockedLesson: "Gabung komunitas ini dulu untuk membuka materinya",
  watchOnYoutube: "Tonton di YouTube",
  material: "Materi",
  resources: "Link & Resource",
  prevLesson: "Sebelumnya",
  nextLesson: "Berikutnya",
  backToCourse: "Kembali ke kelas",
  videoUnavailable: "Materi ini belum punya video",
  videos: "Video",
  // "Tentang kelas ini" + biaya — derived from data already in hand (no schema/deploy)
  costLabel: "Biaya sampai selesai",
  costFree: "Gratis",
  costFreeSub: "Semua materi kelas ini gratis — kamu cukup punya koneksi internet.",
  costMore: "Selengkapnya",
  costDetail:
    "Study with Rahman adalah gerakan sukarela, jadi semua kelas gratis selamanya. Materi memakai YouTube dan tool yang umumnya punya paket gratis. Kalau ada materi yang menyarankan tool berbayar, itu opsional dan selalu disebutkan alternatif gratisnya.",
  // manage surface
  manageTitle: "Kelola Kelas",
  newCourse: "Kelas baru",
  emptyManageTitle: "Belum ada kelas",
  emptyManageBody:
    "Mulai susun materi komunitasmu. Buat kelas pertama, lalu tambahkan materi ke dalamnya.",
  editCourse: "Ubah kelas",
  newLesson: "Materi baru",
  editLesson: "Ubah materi",
  deleteLesson: "Hapus materi",
  deleteConfirm: "Yakin? Aksi ini tidak bisa dibatalkan.",
  // placement — materi milik komunitas, kelas cuma menempatkannya
  addMateri: "Tambah materi",
  addMateriPick: "Pilih materi yang sudah ada",
  addMateriEmpty: "Semua materi komunitas sudah ada di kelas ini",
  addMateriSuccess: "Materi ditambahkan ke kelas",
  removeMateri: "Keluarkan dari kelas",
  removeMateriSuccess: "Materi dikeluarkan dari kelas",
  removeMateriConfirm:
    "Materi tetap tersimpan di perpustakaan komunitas dan kelas lain yang memakainya tidak terpengaruh.",
  materiPublished: "Materi diterbitkan",
  materiDrafted: "Materi dijadikan draft",
  fieldTitle: "Judul",
  fieldSlug: "Slug (URL)",
  fieldDescription: "Deskripsi",
  fieldCover: "URL cover (opsional)",
  fieldYoutube: "Video YouTube (tempel URL atau ID)",
  fieldYoutubeHint: "Cukup ID 11 karakter — URL akan diekstrak otomatis",
  fieldContent: "Materi (markdown)",
  fieldLinks: "Link resource",
  addLink: "Tambah link",
  linkLabel: "Label",
  linkUrl: "URL",
  save: "Simpan",
  cancel: "Batal",
  saving: "Menyimpan…",
  statusDraft: "Draft",
  statusPublished: "Terbit",
  statusArchived: "Arsip",
  publish: "Terbitkan",
  unpublish: "Jadikan draft",
  archive: "Arsipkan",
  publishSuccess: "Kelas diterbitkan",
  archiveSuccess: "Kelas diarsipkan",
  reorderSuccess: "Urutan materi diperbarui",
  moveUp: "Naikkan",
  moveDown: "Turunkan",
  // errors (ConvexError.code → user copy; VALIDATION_FAILED uses server msg)
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Data tidak ditemukan",
  errRateLimited: "Terlalu banyak permintaan — coba lagi nanti",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type CoursesCopy = { [K in keyof typeof COURSES_COPY]: string };
export type CoursesCopyOverride = Partial<CoursesCopy>;

export function mergeCopy(override?: CoursesCopyOverride): CoursesCopy {
  return override ? { ...COURSES_COPY, ...override } : COURSES_COPY;
}
