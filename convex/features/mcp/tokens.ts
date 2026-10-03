import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query, type ActionCtx, type MutationCtx, type QueryCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { requirePlatformAdmin, requireUser } from "../../_shared/auth";
import { hashMcpToken, newMcpToken } from "./crypto";
import { mcpScope, tokenItem, tokenTtl, type McpScope } from "./contract";

const TOKEN_CAP = 20;
async function requireIssuer(ctx: QueryCtx | MutationCtx, scope: McpScope) {
  const userId = await requireUser(ctx);
  if (scope === "admin") await requirePlatformAdmin(ctx);
  if (await ctx.db.get(userId) === null) throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Akun tidak tersedia" });
  return userId;
}
export const issuer = internalQuery({
  args: { scope: mcpScope }, returns: v.null(),
  handler: async (ctx, args) => { await requireIssuer(ctx, args.scope); return null; },
});
export const insert = internalMutation({
  args: { scope: mcpScope, label: v.string(), ttlDays: tokenTtl, tokenHash: v.string() },
  returns: v.object({ tokenId: v.id("mcpTokens"), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await requireIssuer(ctx, args.scope);
    const label = args.label.trim();
    if (!label || label.length > 64 || !/^[a-f0-9]{64}$/.test(args.tokenHash)) throw new ConvexError({ code: "VALIDATION_FAILED", message: "Nama token harus 1–64 karakter" });
    const rows = await ctx.db.query("mcpTokens").withIndex("by_user", q => q.eq("userId", userId)).take(TOKEN_CAP + 1);
    if (rows.length >= TOKEN_CAP) throw new ConvexError({ code: "RATE_LIMITED", message: "Maksimal 20 token. Cabut token yang tidak digunakan" });
    const expiresAt = Date.now() + args.ttlDays * 86_400_000;
    const tokenId = await ctx.db.insert("mcpTokens", { userId, label, scope: args.scope, tokenHash: args.tokenHash, expiresAt });
    return { tokenId, expiresAt };
  },
});
async function requireActionIssuer(ctx: ActionCtx, scope: McpScope) {
  await ctx.runQuery(internal.features.mcp.tokens.issuer, { scope });
}
export const issue = action({
  args: { label: v.string(), scope: mcpScope, ttlDays: tokenTtl },
  returns: v.object({ token: v.string(), tokenId: v.id("mcpTokens"), expiresAt: v.number() }),
  handler: async (ctx, args): Promise<{ token: string; tokenId: Id<"mcpTokens">; expiresAt: number }> => {
    await requireActionIssuer(ctx, args.scope);
    const token = newMcpToken(args.scope);
    const created = await ctx.runMutation(internal.features.mcp.tokens.insert, { ...args, tokenHash: await hashMcpToken(token) });
    return { token, ...created };
  },
});
export const list = query({
  args: {}, returns: v.array(tokenItem),
  handler: async ctx => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("mcpTokens").withIndex("by_user", q => q.eq("userId", userId)).order("desc").take(TOKEN_CAP);
    return rows.map(row => ({ tokenId: row._id, label: row.label, scope: row.scope, createdAt: row._creationTime,
      expiresAt: row.expiresAt, lastUsedAt: row.lastUsedAt ?? null, expired: row.expiresAt <= Date.now() }));
  },
});
export const revoke = mutation({
  args: { tokenId: v.id("mcpTokens") }, returns: v.object({ revoked: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(args.tokenId);
    if (!row) return { revoked: false };
    if (row.userId !== userId) throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Token bukan milik akun ini" });
    await ctx.db.delete(row._id);
    return { revoked: true };
  },
});
