// Internal finite fanout from markLessonComplete. Recheck mutable state rather
// than trusting the user's access at scheduling time. Each course is isolated
// so 50 shared placements cannot exceed one transaction's read limits.
import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { deriveCourseProgress, ensureCourseCompletion, type LegacyEligibility } from "./derive";

export const settle = internalMutation({
  args: { userId: v.id("users"), lessonId: v.id("lessons"), courseId: v.id("courses") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    const lesson = await ctx.db.get(args.lessonId);
    if (course === null || lesson === null || course.status !== "published" ||
      course.tenantId !== lesson.tenantId || (lesson.status ?? "published") !== "published") return false;
    const tenant = await ctx.db.get(course.tenantId);
    if (tenant?.status !== "active") return false;
    const membership = await ctx.db.query("memberships")
      .withIndex("by_tenant_user", (q) => q.eq("tenantId", course.tenantId).eq("userId", args.userId)).first();
    if (membership === null) return false;
    const placement = await ctx.db.query("courseLessons")
      .withIndex("by_course_lesson", (q) => q.eq("courseId", course._id).eq("lessonId", lesson._id)).first();
    if (placement?.tenantId !== course.tenantId) return false;
    const completion = await ctx.db.query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", args.userId).eq("lessonId", lesson._id)).first();
    if (completion?.tenantId !== course.tenantId) return false;
    const legacyEligibility: LegacyEligibility = new Map([[lesson._id, {
      tenantId: lesson.tenantId, published: true,
    }]]);
    const progress = await deriveCourseProgress(ctx, args.userId, course._id, undefined, legacyEligibility);
    if (!progress.isComplete) return false;
    return ensureCourseCompletion(ctx, { tenantId: course.tenantId, userId: args.userId, courseId: course._id });
  },
});
