import type { Id } from "../../convex/_generated/dataModel";
import type { PlatformAnalyticsData, PlatformAnalyticsDays } from "../../slices/analytics/types";
export type FixtureState = "complete" | "partial" | "empty";
const day = (offset: number) => new Date(Date.UTC(2026, 9, 3 - offset)).toISOString().slice(0, 10);
export function learningData(days: PlatformAnalyticsDays, state: FixtureState): PlatformAnalyticsData {
  const exact = state !== "partial";
  const isEmpty = state === "empty";
  const count = (value: number) => ({ value: isEmpty ? 0 : value, exact });
  const series = Array.from({ length: days }, (_, index) => ({ day: day(days - index - 1), activeLearners: isEmpty ? 0 : 4 + index % 3,
    readMemberDays: isEmpty ? 0 : 8 + index % 5, lessonCompletions: isEmpty ? 0 : index % 4,
    badges: isEmpty ? 0 : Number(index % 7 === 0), quizAttempts: isEmpty ? 0 : index % 3,
    quizPassed: isEmpty ? 0 : Number(index % 3 > 0), comments: isEmpty ? 0 : index % 2, newMembers: isEmpty ? 0 : Number(index % 7 === 0), complete: exact,
  }));
  const sum = (key: "readMemberDays" | "lessonCompletions" | "badges" | "quizAttempts" | "quizPassed" | "comments" | "newMembers") => series.reduce((total, row) => total + row[key], 0);
  const share = (value: number, index: number, groups: number) => Math.floor(value / groups) + Number(index < value % groups);
  const communities = isEmpty ? [] : [0, 1].map(index => ({ tenantId: `fixture-tenant-${index}` as Id<"tenants">, slug: `fixture-${index}`, name: index ? "Komunitas uji dengan nama panjang untuk pemeriksaan tampilan dan pembungkusan teks" : "Komunitas fixture lokal", status: "active" as const,
    members: 16, courses: 2, lessons: 12, activeLearners: 4,
    readMemberDays: share(sum("readMemberDays"), index, 2), lessonCompletions: share(sum("lessonCompletions"), index, 2), badges: share(sum("badges"), index, 2), quizAttempts: share(sum("quizAttempts"), index, 2), quizPassed: share(sum("quizPassed"), index, 2), comments: share(sum("comments"), index, 2), newMembers: share(sum("newMembers"), index, 2), complete: exact,
  }));
  const courses = isEmpty ? [] : Array.from({ length: 4 }, (_, index) => ({ courseId: `fixture-course-${index}` as Id<"courses">, tenantSlug: `fixture-${index % 2}`, slug: `kelas-${index}`, title: `Kelas fixture ${index + 1} — ${index === 3 ? "labelpanjangtanpaspasi".repeat(8) : "praktik AI"}`, status: index === 3 ? "draft" as const : "published" as const, eligibleLessons: 6, badges: share(sum("badges"), index, 4), quizAttempts: share(sum("quizAttempts"), index, 4), quizPassed: share(sum("quizPassed"), index, 4), complete: exact }));
  return { period: { days, from: day(days - 1), to: day(0), timezone: "Asia/Jakarta" }, sources: [{ name: "memberships (fixture)", rowsRead: isEmpty ? 0 : 32, complete: exact }, { name: "materiViews (fixture)", rowsRead: sum("readMemberDays"), complete: exact }],
    summary: { users: count(25), communities: count(2), memberships: count(32), courses: count(4), lessons: count(24), skills: count(2), quizzes: count(4), activeLearners: count(8), readMemberDays: count(sum("readMemberDays")), lessonCompletions: count(sum("lessonCompletions")), badges: count(sum("badges")), quizAttempts: count(sum("quizAttempts")), quizPassed: count(sum("quizPassed")), comments: count(sum("comments")), newMembers: count(sum("newMembers")), quizPassRate: exact && !isEmpty ? Math.round(sum("quizPassed") * 1000 / Math.max(1, sum("quizAttempts"))) / 10 : null },
    inventory: { tenantStatus: { active: count(2), pending: count(0), suspended: count(0) }, courseStatus: { published: count(3), draft: count(1), archived: count(0) }, membershipRole: { owner: count(2), instructor: count(3), member: count(27) }, neverReadLessons: count(4) }, series, communities, courses,
    lessons: isEmpty ? [] : Array.from({ length: 26 }, (_, index) => ({ lessonId: `fixture-lesson-${index}` as Id<"lessons">, tenantSlug: `fixture-${index % 2}`, slug: `materi-${index}`, title: `Materi fixture ${index + 1}${index === 5 ? " — judul materi panjang untuk memastikan pembaca dapat membandingkan angka tanpa halaman melebar" : ""}`, kind: index > 23 ? "skill" as const : "materi" as const, status: "published" as const, readMemberDays: index < 4 || index > 23 ? 0 : share(sum("readMemberDays"), index - 4, 20), readers: index < 4 || index > 23 ? 0 : Math.min(8, share(sum("readMemberDays"), index - 4, 20)), completions: index < 4 || index > 23 ? 0 : share(sum("lessonCompletions"), index - 4, 20), comments: index < 4 || index > 23 ? 0 : share(sum("comments"), index - 4, 20), complete: exact })),
    quizzes: courses.map((course, index) => ({ quizId: `fixture-quiz-${index}` as Id<"quizzes">, courseId: course.courseId, tenantSlug: course.tenantSlug, courseSlug: course.slug, title: `Kuis fixture ${index + 1}`, attempts: course.quizAttempts, passed: course.quizPassed, averageScore: exact ? 75 + index : null, complete: exact })),
  };
}
