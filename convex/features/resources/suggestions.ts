// resources feature — suggestion (usulan kelas/topik, R9) mutations. P0: v.*
// validators + authz helper on the first line, before any write.
// - submit: member of the tenant; lands as `open`.
// - setStatus: instructor+ triages open → planned / done / rejected.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { requireInstructorForSuggestion } from "./access";
import { assertUnderLimit, countUserOpenSuggestions } from "./antiSpam";
import { scheduleNotify, SUGGESTION_STATUS_LABEL } from "./notify";
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
    const { userId, suggestion } = await requireInstructorForSuggestion(ctx, args.suggestionId);
    const statusChanged = suggestion.status !== args.status;
    await ctx.db.patch(suggestion._id, { status: args.status });

    // Producer (#22): tell the submitter their suggestion moved. Skipped when
    // the status did not actually change (idempotent re-set → no spam) and for
    // self-triage (guard inside scheduleNotify). Single bounded tenant get.
    if (statusChanged) {
      const tenant = await ctx.db.get(suggestion.tenantId);
      if (tenant !== null) {
        await scheduleNotify(ctx, userId, {
          userId: suggestion.submittedBy,
          tenantId: suggestion.tenantId,
          kind: "suggestion_status",
          title: "Status usulanmu diperbarui",
          body: `"${suggestion.title}" kini ${SUGGESTION_STATUS_LABEL[args.status]}.`,
          href: `/resources/${tenant.slug}`,
        });
      }
    }
    return suggestion._id;
  },
});
