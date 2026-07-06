// resources feature — resource mutations (R8). P0 contract per handler:
// v.* validators + authz helper on the first line, before any write.
// - submit: member of the tenant; lands as `pending` (curation gate).
// - curate: instructor+ approve/reject; records reviewedBy.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { assertCourseInTenant, requireInstructorForResource } from "./access";
import { assertUnderLimit, countUserPendingResources } from "./anti-spam";
import { assertNote, assertTitle, assertUrl } from "./validate";

/**
 * Member submits a resource — starts `pending` (invisible to other members
 * until an instructor approves; enforced in the read queries, not just the UI).
 * Anti-spam: rejected with RATE_LIMITED past the per-tenant pending cap.
 */
export const submit = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    url: v.string(),
    note: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    assertTitle(args.title);
    assertUrl(args.url);
    if (args.note !== undefined) assertNote(args.note);
    if (args.courseId !== undefined) {
      await assertCourseInTenant(ctx, args.courseId, args.tenantId);
    }
    assertUnderLimit(await countUserPendingResources(ctx, args.tenantId, userId));

    const note = args.note?.trim();
    return ctx.db.insert("resources", {
      tenantId: args.tenantId,
      title: args.title.trim(),
      url: args.url.trim(),
      note: note ? note : undefined,
      courseId: args.courseId,
      submittedBy: userId,
      status: "pending",
    });
  },
});

/**
 * Instructor+ approves or rejects a pending resource. Records reviewedBy so the
 * queue shows who curated it. Auth runs BEFORE the by-ID read (access helper).
 */
export const curate = mutation({
  args: {
    resourceId: v.id("resources"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const { userId, resource } = await requireInstructorForResource(ctx, args.resourceId);
    await ctx.db.patch(resource._id, { status: args.decision, reviewedBy: userId });
    return resource._id;
  },
});
