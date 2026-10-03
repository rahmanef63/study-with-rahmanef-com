import { useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "../../components/ui/button";
import { McpTokenSetup } from "../../components/mcp/token-setup";
import { McpTokenTable, McpRevokeDialog } from "../../components/mcp/token-table";
import type { FreshToken, TokenRow } from "../../components/mcp/model";

const tokenId = "fixture-token-only" as Id<"mcpTokens">;
const freshToken: FreshToken = { token: "FIXTURE_ONLY_NOT_A_REAL_CREDENTIAL", tokenId, expiresAt: Date.UTC(2026, 10, 3) };
const initialRows: TokenRow[] = [
  { tokenId, label: "Token fixture administratif dengan nama panjang untuk pengujian tabel", scope: "admin", createdAt: Date.UTC(2026, 9, 3), expiresAt: Date.UTC(2026, 10, 3), lastUsedAt: null, expired: false },
  { tokenId: "fixture-expired-only" as Id<"mcpTokens">, label: "Token fixture kedaluwarsa", scope: "admin", createdAt: Date.UTC(2026, 8, 1), expiresAt: Date.UTC(2026, 8, 8), lastUsedAt: Date.UTC(2026, 8, 2), expired: true },
];
export function FixtureMcp() {
  const [fresh, setFresh] = useState<FreshToken | null>(freshToken);
  const [rows, setRows] = useState(initialRows);
  const [target, setTarget] = useState<TokenRow | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fail, setFail] = useState(false);
  return <div className="min-w-0 space-y-6">
    <p className="text-sm text-muted-foreground">Semua token di halaman ini adalah string fixture, tidak dapat mengakses server mana pun. Tidak ada pembuatan atau pencabutan token produksi.</p>
    <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" onClick={() => { setFresh(freshToken); setRows(initialRows); }}>Reset fixture token</Button><Button variant="outline" className="min-h-11" aria-pressed={fail} onClick={() => setFail(value => !value)}>{fail ? "Mode gagal lokal aktif" : "Simulasikan gagal mencabut"}</Button></div>
    <McpTokenSetup scope="admin" fresh={fresh} onHide={() => setFresh(null)} />
    <McpTokenTable rows={rows} pending={pending} onRevoke={row => { setTarget(row); setError(null); }} />
    <McpRevokeDialog target={target} pending={pending} error={error} onClose={() => setTarget(null)} onConfirm={async () => {
      if (!target || pending) return false;
      setPending(true);
      await new Promise(resolve => setTimeout(resolve, 350));
      setPending(false);
      if (fail) { setError("Kegagalan fixture. Token tetap ada; dialog tetap terbuka."); return false; }
      setRows(current => current.filter(row => row.tokenId !== target.tokenId));
      if (target.tokenId === tokenId) setFresh(null);
      return true;
    }} />
  </div>;
}
