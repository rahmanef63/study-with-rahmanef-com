import type { Infer } from "convex/values";
import type { Id } from "@convex/_generated/dataModel";
import type { McpScope, tokenItem } from "@convex/features/mcp/contract";

export type { McpScope };
export type TokenRow = Infer<typeof tokenItem>;
export type FreshToken = { token: string; tokenId: Id<"mcpTokens">; expiresAt: number };
export type TokenTtl = 7 | 30 | 90;
export const mcpEndpoint = (scope: McpScope) => `https://study-with.rahmanef.com/api/mcp/${scope}`;
export const mcpConfiguration = (scope: McpScope) => JSON.stringify({
  mcpServers: { "study-with-rahman": { url: mcpEndpoint(scope), headers: { Authorization: "Bearer TOKEN_BARU_ANDA" } } },
}, null, 2);
export const tokenDate = (at: number | null) => at === null ? "Belum digunakan" : new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(at);
export function mcpError(error: unknown): string {
  const data = error && typeof error === "object" && "data" in error ? error.data : null;
  const code = data && typeof data === "object" && "code" in data ? data.code : null;
  switch (code) {
    case "NOT_AUTHENTICATED": return "Sesi berakhir. Masuk kembali untuk mengelola token.";
    case "NOT_AUTHORIZED": return "Akun ini tidak memiliki akses MCP admin.";
    case "VALIDATION_FAILED": return "Periksa nama token dan masa berlakunya.";
    case "RATE_LIMITED": return "Batas token tercapai. Cabut token yang tidak digunakan, lalu coba lagi.";
    case "NOT_FOUND": return "Token tidak ditemukan atau sudah dicabut.";
    default: return "Permintaan gagal. Data tetap tersimpan; periksa daftar token sebelum mencoba lagi.";
  }
}
