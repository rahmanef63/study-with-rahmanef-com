import { ConvexError } from "convex/values";
import type { Id, TableNames } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { CAPABILITIES } from "./capabilities";
import type { McpScope } from "./contract";

const invalid = () => new ConvexError({ code: "VALIDATION_FAILED", message: "Argumen capability MCP tidak valid" });
export function parseArguments(scope: McpScope, capability: string, json: string): Record<string, unknown> {
  const spec = CAPABILITIES.find(c => c.id === capability && c.scope === scope);
  if (!spec || json.length > 16_000) throw invalid();
  let args: unknown;
  try { args = JSON.parse(json); } catch { throw invalid(); }
  if (!args || typeof args !== "object" || Array.isArray(args)) throw invalid();
  const record = args as Record<string, unknown>;
  if (Object.keys(record).some(key => !Object.hasOwn(spec.fields, key))) throw invalid();
  for (const [key, field] of Object.entries(spec.fields)) {
    const value = record[key];
    if (value === undefined && field.optional) continue;
    if (typeof value !== (field.type === "integer" ? "number" : field.type)) throw invalid();
    if (typeof value === "number" && (!Number.isFinite(value) || (field.type === "integer" && !Number.isInteger(value)) || (field.enum && !field.enum.includes(value)) || (field.minimum !== undefined && value < field.minimum) || (field.maximum !== undefined && value > field.maximum))) throw invalid();
    if (typeof value === "string" && (!value.trim() || value.length > (field.maxLength ?? 128) || (field.enum && !field.enum.includes(value)))) throw invalid();
  }
  if (record.limit !== undefined && (!Number.isInteger(record.limit) || Number(record.limit) < 1 || Number(record.limit) > 100)) throw invalid();
  return record;
}
export function argumentId<T extends TableNames>(ctx: QueryCtx | MutationCtx, args: Record<string, unknown>, key: string, table: T): Id<T> {
  const value = args[key];
  if (typeof value !== "string") throw invalid();
  const normalized = ctx.db.normalizeId(table, value);
  if (!normalized) throw invalid();
  return normalized;
}
