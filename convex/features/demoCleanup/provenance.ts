import { ConvexError } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { SEED_MEMBERS } from "../../_seed/engagementData";

export function refuse(): never {
  throw new ConvexError({ code: "VALIDATION_FAILED", message: "Pembersihan demo dibatalkan; verifikasi data terlebih dahulu" });
}

/** Email alone is never proof: preserve changed, authenticated or privileged rows. */
export async function verifyDemo(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return null; // A completed batch is safe to replay.
  const seed = SEED_MEMBERS.find((member) => member.email === user.email);
  const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
  if (!seed || user.name !== seed.displayName || !profile || profile.username !== seed.username ||
      profile.displayName !== seed.displayName || profile.bio !== seed.bio || profile.isPlatformAdmin || profile.avatarUrl !== undefined ||
      user.emailVerificationTime !== undefined || user.phoneVerificationTime !== undefined || user.isAnonymous !== undefined || user.phone !== undefined || user.image !== undefined) refuse();
  const protectedRows = await Promise.all([
    ctx.db.query("authAccounts").withIndex("userIdAndProvider", (q) => q.eq("userId", userId)).first(),
    ctx.db.query("authSessions").withIndex("userId", (q) => q.eq("userId", userId)).first(),
    ctx.db.query("mcpTokens").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ctx.db.query("userActivityEvents").withIndex("by_user_at", (q) => q.eq("userId", userId)).first(),
    ctx.db.query("userActivityBudgets").withIndex("by_user", (q) => q.eq("userId", userId)).first(),
    ctx.db.query("tenants").withIndex("by_owner_status", (q) => q.eq("ownerId", userId)).first(),
    ctx.db.query("courses").withIndex("by_creator", (q) => q.eq("createdBy", userId)).first(),
    ctx.db.query("lessons").withIndex("by_author", (q) => q.eq("authorId", userId)).first(),
  ]);
  if (protectedRows.some(Boolean)) refuse();
  const memberships = await ctx.db.query("memberships").withIndex("by_user", (q) => q.eq("userId", userId)).take(201);
  if (memberships.length > 200 || memberships.some((row) => row.role !== "member")) refuse();
  return { user, profile, memberships };
}
