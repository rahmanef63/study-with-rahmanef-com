// posts feature — Discord webhook posting for `kind: "pengumuman"`, server-only.
//
// MOVED from convex/features/announcements/discord.ts (v1.8 #33). The
// announcements board is retired — pengumuman is now just a `posts` kind — but
// the webhook fan-out is the one piece of that feature worth keeping, so it
// hangs off posts:create instead. Behaviour is unchanged apart from the source
// row and the dropped `postedToDiscord` flag: `posts` carries no such column
// (adding one is a schema change, integrator-only) and the action is scheduled
// exactly once, from create, so there is nothing to de-duplicate against.
//
// P0 (DATA-MODEL.md security note #1 / AGENTS.md §6): tenants.discordWebhookUrl
// must NEVER be an arg, a return value of a PUBLIC function, or reachable from
// the client. The URL flows strictly: DB → internalQuery → internalAction →
// fetch. Both functions below are `internal*` (un-callable from any client); the
// URL is read INSIDE the action's data-load and used only to POST. It is never
// logged (a fetch error can embed the URL, so we log a static string).
import { v } from "convex/values";
import { internalAction, internalQuery } from "../../_generated/server";
import { loadForDiscordRef } from "./refs";
import { formatDiscordMessage } from "./validate";

/**
 * Load one pengumuman + its tenant's webhook for the action. INTERNAL only —
 * returns the webhook URL, so it must never be exposed as a public function.
 * Returns null (→ silent no-op) for a missing post, a post that is not a
 * pengumuman, a post soft-deleted between create and dispatch, or a dangling
 * tenant.
 */
export const loadForDiscord = internalQuery({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (post === null) return null;
    if (post.kind !== "pengumuman") return null; // only announcements go to Discord
    if (post.deletedAt !== undefined) return null; // deleted before dispatch
    const tenant = await ctx.db.get(post.tenantId);
    if (tenant === null) return null;
    return {
      title: post.title,
      bodyMd: post.bodyMd,
      tenantName: tenant.name,
      webhookUrl: tenant.discordWebhookUrl ?? null,
    };
  },
});

/**
 * Post a pengumuman to the tenant's Discord webhook. INTERNAL only, scheduled
 * by posts:create. No webhook configured → no-op. On any failure the post is
 * left intact and a URL-free / PII-free line is logged (rr-conventions
 * "Logging").
 */
export const postToDiscord = internalAction({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(loadForDiscordRef, { postId: args.postId });
    if (data === null) return; // post gone / not a pengumuman / tenant gone
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
        console.error("[posts:postToDiscord]", `discord webhook status ${res.status}`);
      }
    } catch {
      // Static message: a thrown fetch error can embed the webhook URL (P0).
      console.error("[posts:postToDiscord]", "gagal mengirim ke Discord webhook");
    }
  },
});
