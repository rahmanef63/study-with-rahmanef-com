import type { PlatformSources } from "./platformRead";

export const DAY_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;
export const platformDay = (ms: number) => new Date(ms + WIB_MS).toISOString().slice(0, 10);
export const startOfPlatformDay = (ms: number) => Math.floor((ms + WIB_MS) / DAY_MS) * DAY_MS - WIB_MS;
export function emptyActivity() {
  return { activeLearners: 0, readMemberDays: 0, lessonCompletions: 0, badges: 0,
    quizAttempts: 0, quizPassed: 0, comments: 0, newMembers: 0 };
}
type Activity = ReturnType<typeof emptyActivity>;
type Bucket = { metrics: Activity; active: Set<string> };
const bucket = (): Bucket => ({ metrics: emptyActivity(), active: new Set() });

/** Current valid relations prevent deleted/cross-tenant rows inflating counts.
 * Completion belongs to material; courseId provenance never drives its tally.
 */
export function buildPlatformActivity(s: PlatformSources, fromMs: number, days: number) {
  const tenants = new Map(s.tenants.rows.map(row => [row._id, row]));
  const users = new Set(s.users.rows.map(row => row._id));
  const memberships = s.memberships.rows.filter(row => tenants.has(row.tenantId) && users.has(row.userId));
  const memberKeys = new Set(memberships.map(row => `${row.tenantId}:${row.userId}`));
  const courses = new Map(s.courses.rows.filter(row => tenants.has(row.tenantId)).map(row => [row._id, row]));
  const lessons = new Map(s.lessons.rows.filter(row => tenants.has(row.tenantId)).map(row => [row._id, row]));
  const quizzes = new Map(s.quizzes.rows.filter(row => courses.get(row.courseId)?.tenantId === row.tenantId).map(row => [row._id, row]));
  const posts = new Map(s.posts.rows.filter(row => tenants.has(row.tenantId) && row.deletedAt === undefined).map(row => [row._id, row]));
  const community = new Map([...tenants.keys()].map(id => [id, bucket()]));
  const series = new Map(Array.from({ length: days }, (_, i) => [platformDay(fromMs + i * DAY_MS), bucket()]));
  const total = bucket();
  const lesson = new Map([...lessons.keys()].map(id => [id, { reads: 0, readers: new Set<string>(), completions: 0, comments: 0 }]));
  const course = new Map([...courses.keys()].map(id => [id, { badges: 0, attempts: 0, passed: 0, eligible: new Set<string>() }]));
  const quiz = new Map([...quizzes.keys()].map(id => [id, { attempts: 0, passed: 0, score: 0 }]));
  const validMember = (tenantId: string, userId: string) => memberKeys.has(`${tenantId}:${userId}`);
  const bump = (tenantId: typeof s.tenants.rows[number]["_id"], userId: string, day: string, key: keyof Activity, active = true) => {
    const daily = series.get(day);
    if (!daily) return;
    for (const target of [total, community.get(tenantId)!, daily]) {
      target.metrics[key]++;
      if (active) target.active.add(userId);
    }
  };
  for (const p of s.placements.rows) {
    const c = courses.get(p.courseId), l = lessons.get(p.lessonId);
    if (c && l && c.tenantId === p.tenantId && l.tenantId === p.tenantId && (l.status ?? "published") === "published") {
      course.get(c._id)!.eligible.add(l._id);
    }
  }
  for (const row of memberships) bump(row.tenantId, row.userId, platformDay(row._creationTime), "newMembers", false);
  const viewKeys = new Set<string>();
  for (const row of s.views.rows) {
    const l = lessons.get(row.lessonId), key = `${row.lessonId}:${row.userId}:${row.day}`;
    if (!l || l.tenantId !== row.tenantId || !validMember(row.tenantId, row.userId) || !series.has(row.day) || viewKeys.has(key)) continue;
    viewKeys.add(key);
    bump(row.tenantId, row.userId, row.day, "readMemberDays");
    lesson.get(row.lessonId)!.reads++;
    lesson.get(row.lessonId)!.readers.add(row.userId);
  }
  const completionKeys = new Set<string>();
  for (const row of s.completions.rows) {
    const l = lessons.get(row.lessonId), key = `${row.lessonId}:${row.userId}`;
    if (!l || l.tenantId !== row.tenantId || !validMember(row.tenantId, row.userId) || completionKeys.has(key)) continue;
    completionKeys.add(key);
    bump(row.tenantId, row.userId, platformDay(row._creationTime), "lessonCompletions");
    lesson.get(row.lessonId)!.completions++;
  }
  const badgeKeys = new Set<string>();
  for (const row of s.badges.rows) {
    const c = courses.get(row.courseId), key = `${row.courseId}:${row.userId}`;
    if (!c || c.tenantId !== row.tenantId || !validMember(row.tenantId, row.userId) || badgeKeys.has(key)) continue;
    badgeKeys.add(key);
    bump(row.tenantId, row.userId, platformDay(row._creationTime), "badges");
    course.get(row.courseId)!.badges++;
  }
  for (const row of s.attempts.rows) {
    const q = quizzes.get(row.quizId);
    if (!q || q.tenantId !== row.tenantId || !validMember(row.tenantId, row.userId) || !Number.isFinite(row.scorePct) || row.scorePct < 0 || row.scorePct > 100) continue;
    bump(row.tenantId, row.userId, platformDay(row._creationTime), "quizAttempts");
    quiz.get(row.quizId)!.attempts++; quiz.get(row.quizId)!.score += row.scorePct;
    course.get(q.courseId)!.attempts++;
    if (row.passed) {
      bump(row.tenantId, row.userId, platformDay(row._creationTime), "quizPassed");
      quiz.get(row.quizId)!.passed++; course.get(q.courseId)!.passed++;
    }
  }
  for (const row of s.comments.rows) {
    const target = row.lessonId ? lessons.get(row.lessonId) : row.postId ? posts.get(row.postId) : null;
    if (!!row.lessonId === !!row.postId || row.deletedAt !== undefined || target?.tenantId !== row.tenantId || !validMember(row.tenantId, row.userId)) continue;
    bump(row.tenantId, row.userId, platformDay(row._creationTime), "comments");
    if (row.lessonId) lesson.get(row.lessonId)!.comments++;
  }
  for (const target of [total, ...community.values(), ...series.values()]) target.metrics.activeLearners = target.active.size;
  return { tenants, users, memberships, courses, lessons, quizzes, total, community, series, course, lesson, quiz };
}
