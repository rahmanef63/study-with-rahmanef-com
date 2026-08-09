// tenants slice — community request flow (#6, v1.1). A signed-in user asks to
// open a new community; it is created as a `pending` tenant (invisible to the
// public etalase) awaiting platform-admin review (see admin.ts).
// P0: v.* validators + requireUser as the first handler line; ConvexError
// ({ code, message }) only; no bare .collect().
import { ConvexError, v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireUser } from "../../_shared/auth";
import { buildTenantRequestInput, TENANT_REQUEST_LIMITS } from "./requestHelpers";

/**
 * Request a new community (R7). Any signed-in user may ask; the tenant is
 * created `pending` with the caller as `ownerId` and stays out of the public
 * etalase until a platform admin approves it (admin.approve).
 *
 * Guards, in order:
 *  1. requireUser — anonymous callers rejected before any DB read.
 *  2. Input validation — slug kebab-case + name/description bounds.
 *  3. Anti-spam — at most one pending request per user (RATE_LIMITED).
 *  4. Global slug uniqueness via by_slug (VALIDATION_FAILED on collision).
 */
export const requestTenant = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    track: v.optional(v.string()),
    requestMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const { errors, values } = buildTenantRequestInput(args);
    if (errors.length > 0) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        message: `Input tidak valid: ${errors.join(", ")}`,
      });
    }

    // Anti-spam: one open request per user, counted EXACTLY via the
    // by_owner_status index. The previous bounded by_status scan walked the 500
    // OLDEST pending rows and filtered by owner, so once 500 stale pending rows
    // existed globally the cap stopped firing and any user could squat
    // unlimited slugs. Scan is bounded by the cap itself (cap+1 rows).
    const pending = await ctx.db
      .query("tenants")
      .withIndex("by_owner_status", (q) => q.eq("ownerId", userId).eq("status", "pending"))
      .take(TENANT_REQUEST_LIMITS.pendingPerUser + 1);
    const minePending = pending.length;
    if (minePending >= TENANT_REQUEST_LIMITS.pendingPerUser) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Kamu masih punya pengajuan komunitas yang menunggu persetujuan",
      });
    }

    // Global slug uniqueness — any status occupies the slug (by_slug is unique).
    const clash = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", values.slug))
      .unique();
    if (clash !== null) {
      throw new ConvexError({
        code: "VALIDATION_FAILED",
        message: "Slug sudah dipakai — pilih slug lain",
      });
    }

    const tenantId = await ctx.db.insert("tenants", {
      slug: values.slug,
      name: values.name,
      description: values.description,
      track: values.track,
      requestMessage: values.requestMessage,
      status: "pending",
      ownerId: userId,
    });

    return { tenantId, slug: values.slug, status: "pending" as const };
  },
});
