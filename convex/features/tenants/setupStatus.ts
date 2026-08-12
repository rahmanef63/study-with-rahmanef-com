// tenants feature — "is this community configured yet", as booleans.
//
// EXISTS SO THAT NOBODY HAS TO GUESS. The Discord webhook is deliberately
// write-only: `toManagedTenant` never echoes it, so there is no read path that
// answers "did that save work?" outside the owner's own Kelola screen. That is
// the right call for a secret whose holder can post into your channel — but it
// also meant the only way to check a deploy was to open a browser and log in.
//
// internalQuery: un-callable from any client (AGENTS.md §6). The owner runs it
// through `npx convex run --prod`, and it returns BOOLEANS ONLY — never the
// invite URL, never the webhook, so its output is safe to paste into a chat or
// a CI log.
import { internalQuery } from "../../_generated/server";
import { TENANT_LIMITS } from "./helpers";

export type TenantSetup = {
  slug: string;
  name: string;
  status: string;
  hasDiscordInvite: boolean;
  hasDiscordWebhook: boolean;
  hasCover: boolean;
};

export const list = internalQuery({
  args: {},
  handler: async (ctx): Promise<TenantSetup[]> => {
    const tenants = await ctx.db.query("tenants").take(TENANT_LIMITS.activeListMax);
    return tenants.map((t) => ({
      slug: t.slug,
      name: t.name,
      status: t.status,
      hasDiscordInvite: typeof t.discordInviteUrl === "string" && t.discordInviteUrl.length > 0,
      hasDiscordWebhook: typeof t.discordWebhookUrl === "string" && t.discordWebhookUrl.length > 0,
      hasCover: typeof t.coverImageUrl === "string" && t.coverImageUrl.length > 0,
    }));
  },
});
