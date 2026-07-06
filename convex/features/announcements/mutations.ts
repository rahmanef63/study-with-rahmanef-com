// announcements feature — write surface (R12). Access table (DATA-MODEL.md):
// announcements write = instructor+. P0: v.* validators + authz helper as the
// FIRST handler line; requireTenantRole runs requireUser internally, so an
// unauthenticated caller is rejected before any row is read or written.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { postToDiscordRef } from "./refs";
import { validateCreateInput } from "./validate";

/**
 * Create an announcement (instructor+ on args.tenantId). Inserts with
 * postedToDiscord=false, then fire-and-forget schedules the internal Discord
 * action. The webhook URL is NEVER touched here — the action reads it
 * server-side (DATA-MODEL security note #1). Discord failure never fails the
 * create: the announcement is already saved and the member list shows it.
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    bodyMd: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "instructor");
    const { title, bodyMd } = validateCreateInput(args.title, args.bodyMd);

    const announcementId = await ctx.db.insert("announcements", {
      tenantId: args.tenantId,
      title,
      bodyMd,
      createdBy: userId,
      postedToDiscord: false,
    });

    // Fire-and-forget: post to Discord after the mutation commits. runAfter(0)
    // keeps the mutation fast and the write atomic; the action is idempotent-ish
    // (it only flips postedToDiscord on success).
    await ctx.scheduler.runAfter(0, postToDiscordRef, { announcementId });

    return { announcementId };
  },
});
