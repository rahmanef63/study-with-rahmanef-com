// resources feature — suggestion (usulan kelas/topik, R9) mutations. P0: v.*
// validators + authz helper on the first line, before any write.
// - submit: member of the tenant; lands as `open`.
// - setStatus: instructor+ triages open → planned / done / rejected.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { requireInstructorForSuggestion } from "./access";
import { assertUnderLimit, countUserOpenSuggestions } from "./anti-spam";
import { assertDetail, assertTitle } from "./validate";

/**
 * Member posts a suggestion — starts `open`. Anti-spam: rejected with
 * RATE_LIMITED past the per-tenant open cap.
 */
export const submit = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    assertTitle(args.title);
    if (args.detail !== undefined) assertDetail(args.detail);
    assertUnderLimit(await countUserOpenSuggestions(ctx, args.tenantId, userId));

    const detail = args.detail?.trim();
    return ctx.db.insert("suggestions", {
      tenantId: args.tenantId,
      title: args.title.trim(),
      detail: detail ? detail : undefined,
      submittedBy: userId,
      status: "open",
    });
  },
});

/**
 * Instructor+ triages a suggestion. Full status union is accepted (including
 * `open`, to revert) — schema literals: open | planned | done | rejected.
 */
export const setStatus = mutation({
  args: {
    suggestionId: v.id("suggestions"),
    status: v.union(
      v.literal("open"),
      v.literal("planned"),
      v.literal("done"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const { suggestion } = await requireInstructorForSuggestion(ctx, args.suggestionId);
    await ctx.db.patch(suggestion._id, { status: args.status });
    return suggestion._id;
  },
});
