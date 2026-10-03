import { v, type Infer } from "convex/values";

export const count = v.object({ value: v.number(), exact: v.boolean() });
const nullableText = v.union(v.string(), v.null());
const nullableTime = v.union(v.number(), v.null());
export const activityFields = {
  kind: v.union(v.literal("page"), v.literal("click")), path: v.string(),
  target: v.optional(v.string()), referrerHost: v.optional(v.string()),
  utmSource: v.optional(v.string()), utmCampaign: v.optional(v.string()),
  country: v.optional(v.string()), city: v.optional(v.string()),
  browser: v.optional(v.string()), os: v.optional(v.string()),
  viewport: v.union(v.literal("mobile"), v.literal("tablet"), v.literal("desktop"), v.literal("unknown")),
};
export const activityEvent = v.object({ at: v.number(), ...activityFields });
export const userRow = v.object({
  userId: v.id("users"), username: nullableText, displayName: v.string(), email: nullableText,
  avatarUrl: nullableText, isPlatformAdmin: v.union(v.boolean(), v.null()), joinedAt: v.number(),
  memberships: count, reads: count, lessonsCompleted: count, badges: count, quizAttempts: count,
  lastLearningAt: nullableTime,
  status: v.union(v.literal("belum-belajar"), v.literal("belajar"), v.literal("memiliki-badge"), v.literal("belum-diketahui")),
  latestVisit: v.union(activityEvent, v.null()),
});
export const userList = v.object({
  page: v.array(userRow), isDone: v.boolean(), continueCursor: v.string(),
  splitCursor: v.optional(v.union(v.string(), v.null())),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  searchAppliedToPage: v.literal(true),
});
export const userDetail = v.object({
  user: userRow,
  communities: v.array(v.object({
    tenantId: v.id("tenants"), slug: v.string(), name: v.string(),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("suspended")),
    role: v.union(v.literal("member"), v.literal("instructor"), v.literal("owner")), joinedAt: v.number(),
  })),
  courses: v.array(v.object({
    courseId: v.id("courses"), slug: v.string(), title: v.string(),
    communitySlug: v.string(), communityName: v.string(), total: v.number(), done: v.number(),
    percent: nullableTime, isComplete: v.boolean(), complete: v.boolean(), badge: v.boolean(),
  })),
  reads: v.array(v.object({ lessonId: v.id("lessons"), day: v.string(), at: v.number(), title: v.optional(v.string()), communitySlug: v.optional(v.string()) })),
  quizzes: v.array(v.object({ quizId: v.id("quizzes"), scorePct: v.number(), passed: v.boolean(), at: v.number(), title: v.optional(v.string()), communitySlug: v.optional(v.string()) })),
  activity: v.array(activityEvent), complete: v.boolean(), activityComplete: v.boolean(),
});

export type UserActivity = Infer<typeof activityEvent>;
export type ActivityInput = Omit<UserActivity, "at">;
export type UserRow = Infer<typeof userRow>;
export type UserList = Infer<typeof userList>;
export type UserDetail = Infer<typeof userDetail>;
export type Count = Infer<typeof count>;
