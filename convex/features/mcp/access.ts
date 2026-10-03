import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requirePlatformAdmin } from "../../_shared/auth";
import type { McpScope } from "./contract";

/** INTERNAL boundary only: the caller never supplies an actor identifier.
 * Possession of an unexpired PAT resolves its real owner. Original browser
 * handlers then run their normal guards with that validated principal; roles
 * and community status are read live, never copied into the token.
 */
export async function requireMcpPrincipal<T extends QueryCtx | MutationCtx>(ctx: T, tokenHash: string, scope: McpScope) {
  const denied = () => new ConvexError({ code: "NOT_AUTHENTICATED", message: "Token MCP tidak valid atau sudah berakhir" });
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw denied();
  const token = await ctx.db.query("mcpTokens").withIndex("by_tokenHash", q => q.eq("tokenHash", tokenHash)).unique();
  if (!token || token.expiresAt <= Date.now() || await ctx.db.get(token.userId) === null) throw denied();
  if (token.scope !== scope) throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Token tidak sesuai endpoint MCP" });
  const delegated: T = {
    ...ctx,
    auth: { getUserIdentity: async () => ({ issuer: "study-mcp", tokenIdentifier: `study-mcp:${token._id}`, subject: `${token.userId}|mcp:${token._id}` }) },
  };
  if (scope === "admin") await requirePlatformAdmin(delegated);
  return { delegated, token };
}
