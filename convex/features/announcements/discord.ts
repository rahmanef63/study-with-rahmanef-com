// announcements feature — Discord webhook posting, server-only.
//
// P0 (DATA-MODEL.md security note #1 / AGENTS.md §6): tenants.discordWebhookUrl
// must NEVER be an arg, a return value of a PUBLIC function, or reachable from
// the client. The URL flows strictly: DB → internalQuery → internalAction →
// fetch. All three functions below are `internal*` (un-callable from any client);
// the URL is read INSIDE the action's data-load and used only to POST. It is
// never logged (a fetch error can embed the URL, so we log a static string).
import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
import { loadForDiscordRef, markPostedRef } from "./refs";
import { formatDiscordMessage } from "./validate";

/**
 * Load one announcement + its tenant's webhook for the action. INTERNAL only —
 * returns the webhook URL, so it must never be exposed as a public function.
 */
export const loadForDiscord = internalQuery({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const ann = await ctx.db.get(args.announcementId);
    if (ann === null) return null;
    const tenant = await ctx.db.get(ann.tenantId);
    if (tenant === null) return null;
    return {
      title: ann.title,
      bodyMd: ann.bodyMd,
      tenantName: tenant.name,
      webhookUrl: tenant.discordWebhookUrl ?? null,
    };
  },
});

/** Flip postedToDiscord=true after a confirmed successful post. INTERNAL only. */
export const markPostedToDiscord = internalMutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const ann = await ctx.db.get(args.announcementId);
    if (ann === null) return; // deleted between post and patch — nothing to do
    await ctx.db.patch(args.announcementId, { postedToDiscord: true });
  },
});

/**
 * Post an announcement to the tenant's Discord webhook. INTERNAL only, scheduled
 * by `create`. No webhook configured → no-op (nothing to post; leaves
 * postedToDiscord=false). On any failure the announcement is left intact and a
 * URL-free / PII-free line is logged (rr-conventions "Logging").
 */
export const postToDiscord = internalAction({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(loadForDiscordRef, { announcementId: args.announcementId });
    if (data === null) return; // announcement or tenant gone
    if (data.webhookUrl === null) return; // tenant has no webhook — skip silently

    try {
      const res = await fetch(data.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: formatDiscordMessage(data.title, data.bodyMd, data.tenantName),
        }),
      });
      if (!res.ok) {
        // Status only — never the URL/body (they can contain the secret).
        console.error("[announcements:postToDiscord]", `discord webhook status ${res.status}`);
        return; // leave announcement intact (postedToDiscord stays false)
      }
      await ctx.runMutation(markPostedRef, { announcementId: args.announcementId });
    } catch {
      // Static message: a thrown fetch error can embed the webhook URL (P0).
      console.error("[announcements:postToDiscord]", "gagal mengirim ke Discord webhook");
    }
  },
});
