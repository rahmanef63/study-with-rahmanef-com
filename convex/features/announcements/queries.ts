// announcements feature — member read surface (R12). Access table
// (DATA-MODEL.md): announcements read = member of the tenant. P0: v.* validators
// + authz helper first line; requireTenantRole(member) rejects anonymous and
// non-member callers before any row is read. Bounded via by_tenant index +
// take (no bare .collect()); newest first for the inbox.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import { LIST_TAKE, toAnnouncementView } from "./validate";

/**
 * Announcements for one tenant, newest first — MEMBER-ONLY. Returns the safe
 * projection (toAnnouncementView); the tenant webhook never travels with a row.
 */
export const list = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireTenantRole(ctx, args.tenantId, "member");
    const rows = await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .take(LIST_TAKE);
    return rows.map(toAnnouncementView);
  },
});
