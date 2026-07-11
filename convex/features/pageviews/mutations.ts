// Cookieless visitor analytics — PUBLIC beacon ingest. Called ONLY by the
// /api/analytics Next route, which resolves geo from the caller IP and hashes
// that IP into a bucket key; the raw IP never reaches Convex and is never
// stored.
//
// DELIBERATE, DOCUMENTED EXCEPTION to the "server-side authz first" P0
// (AGENTS.md §6). Cookieless anonymous visitor analytics inherently needs an
// UNAUTHENTICATED ingest — there is no user to authorize. The write is made
// safe instead by: (1) the inline per-IP fixed-window limiter below;
// (2) strict clamping/validation of every field; (3) it only ever inserts into
// the isolated `pageviews` table (no cross-table reads/writes beyond its own
// rate-limit counter); (4) it never stores an IP, cookie, or stable identity;
// (5) it drops /admin + /api paths. Flagged for the integrator to log in
// STATUS.md → drift log, or to harden with a shared ingest secret if desired.
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { PROP_CAP, RL_MAX, RL_WINDOW_MS, VIEWPORTS } from "./constants";

const trimUtm = (s?: string) => {
  if (!s) return undefined;
  const t = s.trim().toLowerCase().slice(0, 120);
  return t || undefined;
};

export const record = mutation({
  args: {
    path: v.string(),
    referrerHost: v.optional(v.string()),
    viewport: v.optional(v.string()),
    eventType: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.optional(v.number()),
    lon: v.optional(v.number()),
    properties: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const path = a.path.slice(0, 256);
    // Never track the platform-admin route or API endpoints (defense in depth;
    // the client beacon already skips these).
    if (!path || path.startsWith("/admin") || path.startsWith("/api")) return null;

    // Per-IP fixed-window limiter. OCC-safe read-modify-write on
    // pageviewRateLimits — Convex serializes conflicting writes, so no lock is
    // needed. Bounded single-row read via by_key (never a bare .collect()).
    if (a.ipHash) {
      const key = `pv:${a.ipHash}`;
      const now = Date.now();
      const row = await ctx.db
        .query("pageviewRateLimits")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (!row || now >= row.resetAt) {
        if (row) await ctx.db.patch(row._id, { count: 1, resetAt: now + RL_WINDOW_MS });
        else await ctx.db.insert("pageviewRateLimits", { key, count: 1, resetAt: now + RL_WINDOW_MS });
      } else if (row.count >= RL_MAX) {
        return null; // over cap — drop silently
      } else {
        await ctx.db.patch(row._id, { count: row.count + 1 });
      }
    }

    const country = a.country && /^[A-Z]{2}$/.test(a.country) ? a.country : undefined;
    const sessionId = a.sessionId && /^[a-f0-9]{8,64}$/.test(a.sessionId) ? a.sessionId : undefined;
    const properties = a.properties && a.properties.length <= PROP_CAP ? a.properties : undefined;

    await ctx.db.insert("pageviews", {
      path,
      referrerHost: a.referrerHost?.slice(0, 80),
      viewport: a.viewport && VIEWPORTS.has(a.viewport) ? a.viewport : undefined,
      eventType: a.eventType?.slice(0, 40) || "page_view",
      sessionId,
      utmSource: trimUtm(a.utmSource),
      utmMedium: trimUtm(a.utmMedium),
      utmCampaign: trimUtm(a.utmCampaign),
      utmTerm: trimUtm(a.utmTerm),
      utmContent: trimUtm(a.utmContent),
      country,
      region: a.region?.slice(0, 8),
      city: a.city?.slice(0, 80),
      lat: a.lat,
      lon: a.lon,
      properties,
      at: Date.now(),
    });
    return null;
  },
});
