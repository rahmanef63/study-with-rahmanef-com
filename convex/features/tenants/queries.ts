// tenants slice — tenant reads.
// P0 contract: v.* validators on every function; guarded first line of every
// handler. Public etalase reads (R2/R3) have no caller to authenticate — their
// guard is the status filter (only `active` tenants are visible, R6) plus the
// safe projection (never `discordWebhookUrl`, DATA-MODEL.md security note #1).
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6): getPublicBySlug,
// getPublicStatsBySlug, listActive — active rows only via index, safe
// projection (toPublicTenant / counts only, never a member list), no auth by
// design. Every OTHER query in this file authenticates on its first line.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import {
  TENANT_LIMITS,
  toManagedTenant,
  toPublicTenant,
  type PublicTenant,
} from "./helpers";

/**
 * Public community profile by slug (`/t/[slug]` etalase).
 * Returns `null` when the slug is unknown OR the tenant is not active —
 * pending/suspended tenants are indistinguishable from missing ones (R6).
 */
export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Guard: active-only + safe projection (public by design, see header).
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (tenant === null || tenant.status !== "active") return null;
    return toPublicTenant(tenant);
  },
});

/**
 * Canceled events are not in `by_tenant_start`, so "has a live session" needs a
 * few rows read and filtered rather than one. 25 is a ceiling, not a page: a
 * community would have to cancel 25 sessions in a row for the probe to answer
 * "no" while a live one exists further down — and the failure mode there is a
 * hidden Kalender tab whose route still works, not lost data.
 */
const EVENT_PROBE_TAKE = 25;

/**
 * Public community stats for the community header — ANONYMOUS (etalase, §6).
 * Member COUNT only; never the member list, never any user data. Bounded by
 * membersPageMax, so a big community reports "200+" rather than walking the
 * table. Returns null for unknown/inactive slugs, same as getPublicBySlug.
 *
 * IT ALSO CARRIES THE TAB SIGNAL (`lib/community-tabs.ts` `TenantTabSignal`),
 * and that is the whole reason it lives here rather than in a query of its own.
 * The community layout is a server component, permanently anonymous, and it
 * already awaits this function on EVERY page under /k/<slug> for the
 * "N anggota · M kelas" line. Three `.take(1)`-shaped index probes ride along
 * inside the same round trip, so hiding always-empty tabs costs the app no
 * extra query — which is the only budget a per-page-load layout read has.
 *
 * The probes are existence checks, never counts: `hasSkills` must not become
 * `skillCount`, or the next reader will render it and this query will start
 * paying for a number nobody navigates by.
 */
export const getPublicStatsBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (tenant === null || tenant.status !== "active") return null;

    const cap = TENANT_LIMITS.membersPageMax;
    const members = await ctx.db
      .query("memberships")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenant._id))
      .take(cap + 1);
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_tenant_status", (q) =>
        q.eq("tenantId", tenant._id).eq("status", "published")
      )
      .take(TENANT_LIMITS.activeListMax + 1);

    // ---- tab signal: three existence probes, all indexed, all bounded ------
    // Materi takes TWO probes because the visibility contract counts a MISSING
    // `status` as published (rows that predate the column) and an index range
    // pinned to "published" cannot see them — the same two-range shape
    // features/materi/queries.ts `publicListSlugs` uses for the sitemap.
    // KIND IS PINNED, and it has to be: a skill IS a `lessons` row, so probing
    // by_tenant_status alone lit `hasMateri` for a skills-only community — the
    // Materi tab would appear and open a library that filters kind === "materi"
    // and renders empty. That is precisely the "tabs are decoration" outcome
    // this signal exists to prevent. Plain materi leave `kind` UNWRITTEN
    // (courses/lessons.createLesson), so undefined IS the materi range.
    const materiWith = async (status: "published" | undefined) =>
      ctx.db
        .query("lessons")
        .withIndex("by_tenant_kind_status", (q) =>
          q.eq("tenantId", tenant._id).eq("kind", undefined).eq("status", status)
        )
        .first();
    const [publishedMateri, legacyMateri] = await Promise.all([
      materiWith("published"),
      materiWith(undefined),
    ]);
    // Skills are ONE exact range — every skill row writes `kind` and `status`
    // explicitly (convex/_seed/seedSkills.ts), so there is no undefined case.
    const skill = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_kind_status", (q) =>
        q.eq("tenantId", tenant._id).eq("kind", "skill").eq("status", "published")
      )
      .first();
    const events = await ctx.db
      .query("events")
      .withIndex("by_tenant_start", (q) => q.eq("tenantId", tenant._id))
      .take(EVENT_PROBE_TAKE);

    return {
      memberCount: Math.min(members.length, cap),
      /** true = the real count exceeds memberCount (render "200+"). */
      memberCountCapped: members.length > cap,
      courseCount: Math.min(courses.length, TENANT_LIMITS.activeListMax),
      /** `TenantTabSignal` — booleans only, never counts. See the note above. */
      hasMateri: publishedMateri !== null || legacyMateri !== null,
      hasSkills: skill !== null,
      hasEvents: events.some((event) => event.canceledAt === undefined),
    };
  },
});

/**
 * Active communities for the landing etalase (R2). Public by design; safe
 * projection; bounded via by_status index + take (no bare .collect()).
 */
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Guard: active-only + safe projection (public by design, see header).
    const limit = Math.min(
      Math.max(1, Math.floor(args.limit ?? TENANT_LIMITS.activeListMax)),
      TENANT_LIMITS.activeListMax
    );
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(limit);
    return tenants.map(toPublicTenant);
  },
});

/**
 * Communities the signed-in user belongs to ("Komunitas saya", UI-UX-PRD §5.3).
 * Auth FIRST (requireUser) — never leaks membership to anon. Bounded by the
 * by_user membership index; returns the public tenant projection + the caller's
 * own role. Active-only, matching R6 (pending/suspended stay invisible).
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(TENANT_LIMITS.activeListMax);
    const out: (PublicTenant & { role: "owner" | "instructor" | "member" })[] = [];
    for (const m of memberships) {
      const tenant = await ctx.db.get(m.tenantId);
      if (tenant === null || tenant.status !== "active") continue;
      out.push({ ...toPublicTenant(tenant), role: m.role });
    }
    return out;
  },
});

/**
 * Owner-only manage view for the tenant settings form (R3 kelola).
 * Reveals `status` and WHETHER a Discord webhook is configured — never the
 * webhook URL itself (write-only secret).
 */
export const getManageView = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "owner");
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null) return null; // deleted between authz and read — treat as gone
    return toManagedTenant(tenant);
  },
});
