import { ConvexError, v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { mcpScope } from "./contract";
import { requireMcpPrincipal } from "./access";

export const consume = internalMutation({
  args: { tokenHash: v.string(), scope: mcpScope }, returns: v.null(),
  handler: async (ctx, args) => {
    const { token } = await requireMcpPrincipal(ctx, args.tokenHash, args.scope);
    const now = Date.now();
    const minuteStart = Math.floor(now / 60_000) * 60_000;
    const dayStart = Math.floor(now / 86_400_000) * 86_400_000;
    const minuteCount = token.minuteStart === minuteStart ? token.minuteCount ?? 0 : 0;
    const dayCount = token.dayStart === dayStart ? token.dayCount ?? 0 : 0;
    if (minuteCount >= 120 || dayCount >= 2_000) throw new ConvexError({ code: "RATE_LIMITED", message: "Batas pemanggilan MCP tercapai. Coba lagi setelah jendela batas berakhir" });
    await ctx.db.patch(token._id, { minuteStart, minuteCount: minuteCount + 1, dayStart, dayCount: dayCount + 1, lastUsedAt: now });
    return null;
  },
});
