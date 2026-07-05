import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// In-app update channel (headless-core). A clone can't "git pull" itself, but it
// CAN tell the owner when the upstream template shipped a newer version and (if
// they wired a Vercel deploy hook) rebuild on demand. Version comparison happens
// client-side (the app imports CORE_VERSION); these actions only do what the
// browser can't: fetch the upstream manifest, and POST the deploy hook.

// Upstream manifest on the template's default branch. Hardcoded (not client-
// supplied) so this can't be pointed at an arbitrary URL. EDIT the slug to your
// own repo if you fork away from the template.
const UPSTREAM_VERSION_URL =
  "https://raw.githubusercontent.com/rahmanef63/template-bwr/main/version.json";

export const fetchUpstreamVersion = action({
  args: {},
  handler: async () => {
    try {
      const res = await fetch(UPSTREAM_VERSION_URL, { cache: "no-store" } as RequestInit);
      if (!res.ok) return null;
      const json = (await res.json()) as { version?: string; core?: string; channel?: string };
      if (!json?.version) return null;
      return { version: json.version, core: json.core ?? json.version, channel: json.channel ?? "stable" };
    } catch {
      return null;
    }
  },
});

// Rebuild the live site by hitting a Vercel Deploy Hook the owner pasted into
// Convex env (VERCEL_DEPLOY_HOOK_URL). Admin-gated. No-ops cleanly if unset.
export const triggerDeploy = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ok: false as const, reason: "unauthorized" as const };
    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!hook) return { ok: false as const, reason: "no-hook" as const };
    try {
      const res = await fetch(hook, { method: "POST" });
      return { ok: res.ok, reason: res.ok ? ("triggered" as const) : ("hook-failed" as const) };
    } catch {
      return { ok: false as const, reason: "hook-failed" as const };
    }
  },
});
