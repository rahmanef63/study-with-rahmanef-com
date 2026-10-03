import type { Id } from "../../convex/_generated/dataModel";
import type { PlatformUserData, PlatformUserDetailData } from "../../slices/analytics/types";
import type { FixtureState } from "./learning-data";
const at = Date.UTC(2026, 9, 3, 1);
export function usersData(state: FixtureState): PlatformUserData[] {
  if (state === "empty") return [];
  const count = (value: number) => ({ value, exact: state !== "partial" });
  return Array.from({ length: 33 }, (_, index) => ({
    userId: `fixture-user-${index}` as Id<"users">, username: index ? `fixture-${index}` : null,
    displayName: index === 2 ? "IdentitasFixtureTanpaSpasi".repeat(10) : `Pengguna fixture ${index + 1}`,
    email: index ? `fixture-user-${index}@example.test` : null, avatarUrl: null, isPlatformAdmin: index === 1, joinedAt: at,
    memberships: count(index % 3), reads: count(index % 12), lessonsCompleted: count(index % 5), badges: count(Number(index % 3 === 1)), quizAttempts: count(index % 4),
    lastLearningAt: index ? at - index * 60000 : null, status: index === 0 ? "belum-belajar" : index % 3 === 1 ? "memiliki-badge" : "belajar",
    latestVisit: index % 2 ? { at, kind: "page", path: "/k/fixture/kelas", country: "ID", city: "Bandung", referrerHost: "example.test", utmSource: "fixture-source", utmCampaign: "fixture-campaign", viewport: "mobile", browser: "Firefox", os: "Android" } : null,
  }));
}
export function userDetailData(state: FixtureState): PlatformUserDetailData {
  const user = usersData("complete")[2];
  const complete = state !== "partial";
  if (state === "empty") return { user: usersData("complete")[0], communities: [], courses: [], reads: [], quizzes: [], activity: [], complete: true, activityComplete: true };
  return {
    user: { ...user, latestVisit: null }, complete, activityComplete: complete,
    communities: [{ tenantId: "fixture-tenant" as Id<"tenants">, slug: "fixture", name: "Komunitas fixture lokal", status: "active", role: "member", joinedAt: at }],
    courses: Array.from({ length: 12 }, (_, index) => ({ courseId: `fixture-course-${index}` as Id<"courses">, slug: `fixture-course-${index}`, title: index === 2 ? "JudulKelasFixtureTanpaSpasi".repeat(9) : `Kelas fixture ${index + 1}`, communitySlug: "fixture", communityName: "Komunitas fixture lokal", total: 14, done: index === 0 ? 14 : 4, percent: complete ? index === 0 ? 100 : 28.6 : null, isComplete: index === 0, complete, badge: index === 0 })),
    reads: Array.from({ length: 14 }, (_, index) => ({ lessonId: `fixture-lesson-${index}` as Id<"lessons">, title: `Materi fixture ${index + 1}`, communitySlug: "fixture", day: "2026-10-03", at: at - index * 60000 })),
    quizzes: Array.from({ length: 12 }, (_, index) => ({ quizId: `fixture-quiz-${index}` as Id<"quizzes">, title: `Kuis fixture ${index + 1}`, communitySlug: "fixture", scorePct: index % 2 ? 60 : 100, passed: index % 2 === 0, at: at - index * 60000 })),
    activity: Array.from({ length: 45 }, (_, index) => ({ at: at - index * 60000, kind: index % 2 ? "page" : "click", path: "/k/fixture/materi/contoh", ...(index % 2 ? {} : { target: index === 0 ? `https://example.test/${"tujuan-tanpa-spasi-".repeat(16)}` : "/k/fixture/kelas" }), referrerHost: "example.test", utmSource: "fixture-source", utmCampaign: "fixture-campaign", ...(index % 3 ? { country: "ID", city: "Bandung" } : {}), browser: "Firefox", os: "Linux", viewport: "desktop" })),
  };
}
