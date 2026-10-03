import { v, type Infer } from "convex/values";

export const mcpScope = v.union(v.literal("user"), v.literal("admin"));
export const tokenTtl = v.union(v.literal(7), v.literal(30), v.literal(90));
export const tokenItem = v.object({
  tokenId: v.id("mcpTokens"), label: v.string(), scope: mcpScope,
  createdAt: v.number(), expiresAt: v.number(), lastUsedAt: v.union(v.number(), v.null()), expired: v.boolean(),
});
export const capabilityItem = v.object({
  id: v.string(), description: v.string(), inputSchemaJson: v.string(),
  readOnly: v.boolean(), destructive: v.boolean(), idempotent: v.boolean(),
});
export type McpScope = Infer<typeof mcpScope>;
