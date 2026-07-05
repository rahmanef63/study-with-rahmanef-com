// profiles — public queries (v1 minimal scope, docs/AGENT-PROMPTS.md #4).
// P0 contract: v.* validators on args + authz helper as the FIRST line of
// every handler (docs/rr-conventions.md "server-side authz").
import { v } from "convex/values";
import { requireUser } from "../../_shared/auth";
import { query } from "../../_generated/server";
import { isValidUsername, normalizeUsername } from "./username";
import type { UsernameCheck } from "./types";

/**
 * The caller's own profile, or null when ensureProfile has not run yet
 * (client then triggers ensureProfile). Own-profile read is full-shape:
 * isPlatformAdmin is the caller's own flag (used to gate /admin nav), not a
 * secret from its owner. No public-profile query in v1 — that is row #9.
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Availability probe for the settings form. Normalizes first so the client
 * can preview the canonical form; `available` is true when the normalized
 * name is unused OR already owned by the caller (self no-op).
 */
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args): Promise<UsernameCheck> => {
    const userId = await requireUser(ctx);
    const normalized = normalizeUsername(args.username);
    const valid = isValidUsername(normalized);
    if (!valid) return { normalized, valid, available: false };
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();
    return {
      normalized,
      valid,
      available: existing === null || existing.userId === userId,
    };
  },
});
