import type { PlatformAnalytics } from "./platformContract";
import { buildPlatformActivity, platformDay } from "./platformActivity";
import type { PlatformSources } from "./platformRead";

type Name = keyof PlatformSources;
export function aggregatePlatform(s: PlatformSources, fromMs: number, days: PlatformAnalytics["period"]["days"]): PlatformAnalytics {
  const a = buildPlatformActivity(s, fromMs, days);
  const exact = (...names: Name[]) => names.every(name => s[name].complete);
  const relations: Name[] = ["tenants", "users", "memberships"];
  const learning: Name[] = [...relations, "lessons", "courses", "quizzes"];
  const activityComplete = exact(...learning, "views", "completions", "badges", "attempts", "comments", "posts");
  const quizComplete = exact(...learning, "attempts");
  const count = (value: number, ...names: Name[]) => ({ value, exact: exact(...names) });
  const courseRows = [...a.courses.values()];
  const lessonRows = [...a.lessons.values()];
  const rollups = new Map(s.rollups.rows.filter(row => a.lessons.get(row.lessonId)?.tenantId === row.tenantId).map(row => [row.lessonId, row]));
  const materi = lessonRows.filter(row => (row.kind ?? "materi") === "materi");
  const statusCount = <T extends { status: string }>(rows: T[], status: string) => rows.filter(row => row.status === status).length;
  const m = a.total.metrics;
  return {
    period: { days, from: platformDay(fromMs), to: platformDay(fromMs + (days - 1) * 86_400_000), timezone: "Asia/Jakarta" },
    sources: Object.entries(s).map(([name, source]) => ({ name, rowsRead: source.rowsRead, complete: source.complete })),
    summary: {
      users: count(a.users.size, "users"), communities: count(a.tenants.size, "tenants"),
      memberships: count(a.memberships.length, ...relations), courses: count(a.courses.size, "tenants", "courses"),
      lessons: count(materi.length, "tenants", "lessons"), skills: count(lessonRows.length - materi.length, "tenants", "lessons"),
      quizzes: count(a.quizzes.size, "tenants", "courses", "quizzes"),
      activeLearners: { value: m.activeLearners, exact: activityComplete },
      readMemberDays: count(m.readMemberDays, ...relations, "lessons", "views"),
      lessonCompletions: count(m.lessonCompletions, ...relations, "lessons", "completions"),
      badges: count(m.badges, ...relations, "courses", "badges"),
      quizAttempts: { value: m.quizAttempts, exact: quizComplete }, quizPassed: { value: m.quizPassed, exact: quizComplete },
      comments: count(m.comments, ...relations, "lessons", "comments", "posts"),
      newMembers: count(m.newMembers, ...relations),
      quizPassRate: quizComplete && m.quizAttempts > 0 ? m.quizPassed / m.quizAttempts * 100 : null,
    },
    inventory: {
      tenantStatus: {
        active: count(statusCount([...a.tenants.values()], "active"), "tenants"),
        pending: count(statusCount([...a.tenants.values()], "pending"), "tenants"),
        suspended: count(statusCount([...a.tenants.values()], "suspended"), "tenants"),
      },
      courseStatus: {
        published: count(statusCount(courseRows, "published"), "tenants", "courses"),
        draft: count(statusCount(courseRows, "draft"), "tenants", "courses"),
        archived: count(statusCount(courseRows, "archived"), "tenants", "courses"),
      },
      membershipRole: {
        owner: count(a.memberships.filter(row => row.role === "owner").length, ...relations),
        instructor: count(a.memberships.filter(row => row.role === "instructor").length, ...relations),
        member: count(a.memberships.filter(row => row.role === "member").length, ...relations),
      },
      neverReadLessons: count(s.rollups.complete ? materi.filter(row => (row.status ?? "published") === "published" && !(rollups.get(row._id)?.views)).length : 0, "tenants", "lessons", "rollups"),
    },
    series: [...a.series].map(([day, b]) => ({ day, ...b.metrics, complete: activityComplete })),
    communities: [...a.tenants.values()].map(row => ({
      tenantId: row._id, slug: row.slug, name: row.name, status: row.status,
      members: a.memberships.filter(m => m.tenantId === row._id).length,
      courses: courseRows.filter(c => c.tenantId === row._id).length,
      lessons: lessonRows.filter(l => l.tenantId === row._id && l.kind !== "skill").length,
      ...a.community.get(row._id)!.metrics, complete: activityComplete,
    })),
    courses: courseRows.map(row => {
      const stats = a.course.get(row._id)!;
      return { courseId: row._id, tenantSlug: a.tenants.get(row.tenantId)!.slug, slug: row.slug,
        title: row.title, status: row.status, eligibleLessons: stats.eligible.size, badges: stats.badges,
        quizAttempts: stats.attempts, quizPassed: stats.passed,
        complete: exact(...learning, "placements", "badges", "attempts"),
      };
    }),
    lessons: lessonRows.map(row => {
      const stats = a.lesson.get(row._id)!;
      return { lessonId: row._id, tenantSlug: a.tenants.get(row.tenantId)!.slug, slug: row.slug ?? null,
        title: row.title, kind: row.kind ?? "materi", status: row.status ?? "published",
        readMemberDays: stats.reads, readers: stats.readers.size, completions: stats.completions,
        comments: stats.comments, complete: exact(...relations, "lessons", "views", "completions", "comments", "posts"),
      };
    }),
    quizzes: [...a.quizzes.values()].map(row => {
      const stats = a.quiz.get(row._id)!, c = a.courses.get(row.courseId)!;
      return { quizId: row._id, courseId: c._id, tenantSlug: a.tenants.get(row.tenantId)!.slug,
        courseSlug: c.slug, title: row.title, attempts: stats.attempts, passed: stats.passed,
        averageScore: quizComplete && stats.attempts > 0 ? stats.score / stats.attempts : null, complete: quizComplete,
      };
    }),
  };
}
