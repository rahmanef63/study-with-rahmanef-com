import { ConvexError, v, type Infer } from "convex/values";
import { action, type ActionCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { mcpScope, capabilityItem, type McpScope } from "./contract";
import { hashMcpToken } from "./crypto";
import { CAPABILITIES, capabilityDescriptor } from "./capabilities";

/** Public PAT entry authenticates raw secret; digests are INTERNAL arguments.
 * Never accept userId or a stored digest as a public impersonation credential.
 */
async function requireMcpToken(ctx: ActionCtx, token: string, scope: McpScope) {
  const tokenHash = await hashMcpToken(token);
  await ctx.runMutation(internal.features.mcp.usage.consume, { tokenHash, scope });
  return tokenHash;
}
export const authenticate = action({
  args: { token: v.string(), scope: mcpScope }, returns: v.object({ scope: mcpScope }),
  handler: async (ctx, args): Promise<{ scope: McpScope }> => {
    await requireMcpToken(ctx, args.token, args.scope);
    return { scope: args.scope };
  },
});
export const discover = action({
  args: { token: v.string(), scope: mcpScope }, returns: v.array(capabilityItem),
  handler: async (ctx, args): Promise<Infer<typeof capabilityItem>[]> => {
    await requireMcpToken(ctx, args.token, args.scope);
    return CAPABILITIES.filter(c => c.scope === args.scope).map(capabilityDescriptor);
  },
});
export const execute = action({
  args: { token: v.string(), scope: mcpScope, capability: v.string(), argumentsJson: v.string() }, returns: v.object({ resultJson: v.string() }),
  handler: async (ctx, args): Promise<{ resultJson: string }> => {
    const tokenHash = await requireMcpToken(ctx, args.token, args.scope);
    const capability = CAPABILITIES.find(c => c.id === args.capability && c.scope === args.scope);
    if (!capability) throw new ConvexError({ code: "NOT_AUTHORIZED", message: "Capability tidak tersedia untuk endpoint ini" });
    const request = { tokenHash, scope: args.scope, capability: args.capability, argumentsJson: args.argumentsJson };
    const resultJson = capability.readOnly
      ? await ctx.runQuery(internal.features.mcp.read.execute, request)
      : await ctx.runMutation(internal.features.mcp.write.execute, request);
    return { resultJson };
  },
});
