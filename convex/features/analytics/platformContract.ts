import { v, type Infer } from "convex/values";

export const platformDays = v.union(v.literal(7), v.literal(30), v.literal(90));
const count = v.object({ value: v.number(), exact: v.boolean() });
const nullableNumber = v.union(v.number(), v.null());
const activity = {
  activeLearners: v.number(), readMemberDays: v.number(), lessonCompletions: v.number(),
  badges: v.number(), quizAttempts: v.number(), quizPassed: v.number(),
  comments: v.number(), newMembers: v.number(),
};
const tenantStatus = v.union(v.literal("active"), v.literal("pending"), v.literal("suspended"));
const courseStatus = v.union(v.literal("published"), v.literal("draft"), v.literal("archived"));

/** Safe aggregate projection: identifiers describe content, never people. */
export const platformAnalyticsResult = v.object({
  period: v.object({ days: platformDays, from: v.string(), to: v.string(), timezone: v.literal("Asia/Jakarta") }),
  sources: v.array(v.object({ name: v.string(), rowsRead: v.number(), complete: v.boolean() })),
  summary: v.object({
    users: count, communities: count, memberships: count, courses: count, lessons: count,
    skills: count, quizzes: count, activeLearners: count, readMemberDays: count,
    lessonCompletions: count, badges: count, quizAttempts: count, quizPassed: count,
    comments: count, newMembers: count, quizPassRate: nullableNumber,
  }),
  inventory: v.object({
    tenantStatus: v.object({ active: count, pending: count, suspended: count }),
    courseStatus: v.object({ published: count, draft: count, archived: count }),
    membershipRole: v.object({ owner: count, instructor: count, member: count }),
    neverReadLessons: count,
  }),
  series: v.array(v.object({ day: v.string(), ...activity, complete: v.boolean() })),
  communities: v.array(v.object({
    tenantId: v.id("tenants"), slug: v.string(), name: v.string(), status: tenantStatus,
    members: v.number(), courses: v.number(), lessons: v.number(), ...activity, complete: v.boolean(),
  })),
  courses: v.array(v.object({
    courseId: v.id("courses"), tenantSlug: v.string(), slug: v.string(), title: v.string(),
    status: courseStatus, eligibleLessons: v.number(), badges: v.number(), quizAttempts: v.number(),
    quizPassed: v.number(), complete: v.boolean(),
  })),
  lessons: v.array(v.object({
    lessonId: v.id("lessons"), tenantSlug: v.string(), slug: v.union(v.string(), v.null()),
    title: v.string(), kind: v.union(v.literal("materi"), v.literal("skill")),
    status: v.union(v.literal("published"), v.literal("draft")), readMemberDays: v.number(),
    readers: v.number(), completions: v.number(), comments: v.number(), complete: v.boolean(),
  })),
  quizzes: v.array(v.object({
    quizId: v.id("quizzes"), courseId: v.id("courses"), tenantSlug: v.string(), courseSlug: v.string(),
    title: v.string(), attempts: v.number(), passed: v.number(), averageScore: nullableNumber, complete: v.boolean(),
  })),
});

export type PlatformAnalytics = Infer<typeof platformAnalyticsResult>;
