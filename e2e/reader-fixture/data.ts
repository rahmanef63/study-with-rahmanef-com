import type { Id } from "../../convex/_generated/dataModel";
import type { CourseOverviewData, LessonViewData } from "../../slices/courses/types";
import type { CommentItem } from "../../slices/comments/types";
import type { QuizTakingData } from "../../slices/quiz/types";

export const tenantId = "fixture-tenant" as Id<"tenants">;
export const courseId = "fixture-course" as Id<"courses">;
export const overview: CourseOverviewData = {
  course: { _id: courseId, tenantId, slug: "fixture", title: "Kelas uji lokal dengan empat puluh materi", description: "Tidak terhubung ke produksi", status: "published" },
  lessons: Array.from({ length: 40 }, (_, index) => ({ _id: `lesson-${index + 1}` as Id<"lessons">, slug: `materi-${index + 1}`, title: `Materi ${index + 1}: memahami konteks dan mencoba langkah berikutnya`, order: index, hasVideo: false })),
  viewerRole: "member", lessonCount: 40,
};
export function lessonFor(id: string): LessonViewData {
  const index = Math.max(0, overview.lessons.findIndex((lesson) => lesson._id === id));
  return {
    _id: id as Id<"lessons">, tenantId, title: overview.lessons[index].title, slug: `materi-${index + 1}`, status: "published", viewerRole: "member",
    courseId, courseSlug: "fixture", courseTitle: overview.course.title, order: index,
    prevLessonId: overview.lessons[index - 1]?._id ?? null, nextLessonId: overview.lessons[index + 1]?._id ?? null,
    links: [],
    contentMd: Array.from({ length: 35 }, (_, i) => `## Catatan ${i + 1}\n\nIni adalah bacaan panjang untuk pemeriksaan scroll lokal. Fokus pada satu langkah, periksa hasilnya, lalu lanjutkan ke langkah berikutnya. ${"Bacaan tetap nyaman saat silabus dan diskusi memiliki scroll sendiri. ".repeat(4)}${i === 0 ? "\n\n" + "katatanpaspasi".repeat(90) : ""}`).join("\n\n"),
  };
}
export function commentsFor(target: string): CommentItem[] {
  return Array.from({ length: 40 }, (_, index) => ({
    _id: `${target}-comment-${index}` as Id<"comments">, parentId: null, deleted: false,
    bodyMd: `Komentar lokal ${index + 1}. ${"Pertanyaan panjang tetap berada dalam panel diskusi. ".repeat(4)}${index === 0 ? "alamatpanjang".repeat(40) : ""}`,
    author: { displayName: "Peserta uji lokal", username: "fixture-member" }, createdAt: 1790985600000 + index * 60000, mine: true,
  }));
}
export const quiz: QuizTakingData = {
  _id: "fixture-quiz" as Id<"quizzes">, courseId, tenantId, title: "Kuis presentasi lokal", passingScorePct: 70, questionCount: 12, attemptsAllowed: 3,
  questions: Array.from({ length: 12 }, (_, i) => ({ prompt: `Pertanyaan ${i + 1}: pilihan apa yang akan kamu coba setelah membaca materi ini?`, options: ["Periksa konteks", "Lompati pemeriksaan", "Abaikan hasil"] })),
};
