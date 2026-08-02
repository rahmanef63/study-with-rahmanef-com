// search slice — props-driven copy (Bahasa Indonesia defaults, rr P1:
// no hardcoded copy inside components; everything routes through this map).

export const SEARCH_COPY = {
  sectionTitle: "Pencarian",
  sectionSubtitle: "Cari kelas, materi, dan sumber di komunitas ini",
  placeholder: "Cari kelas, materi, atau sumber…",
  inputLabel: "Kata kunci pencarian",
  hintMin: "Ketik minimal 2 karakter untuk mulai mencari",
  groupCourses: "Kelas",
  groupLessons: "Materi",
  groupResources: "Sumber",
  emptyTitle: "Tidak ada hasil",
  emptyHint: "Coba kata kunci lain — misalnya judul kelas atau topik materi.",
  openCourse: "Buka kelas",
  openLesson: "Buka materi",
  openResource: "Buka sumber (tab baru)",
} as const;

export type SearchCopy = { [K in keyof typeof SEARCH_COPY]: string };
export type SearchCopyOverride = Partial<SearchCopy>;

export function mergeSearchCopy(override?: SearchCopyOverride): SearchCopy {
  return { ...SEARCH_COPY, ...override };
}
