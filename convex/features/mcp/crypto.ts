import { ConvexError } from "convex/values";

export function newMcpToken(scope: "user" | "admin"): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `study_mcp_${scope}_${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}`;
}
export async function hashMcpToken(token: string): Promise<string> {
  if (!/^study_mcp_(user|admin)_[a-f0-9]{64}$/.test(token)) {
    throw new ConvexError({ code: "NOT_AUTHENTICATED", message: "Token MCP tidak valid atau sudah berakhir" });
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}
