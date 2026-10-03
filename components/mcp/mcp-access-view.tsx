"use client";
import Link from "next/link";
import { Component, useState, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { McpTokenSetup } from "./token-setup";
import { McpRevokeDialog, McpTokenTable } from "./token-table";
import { useMcpActions } from "./use-mcp-actions";
import { mcpError, type FreshToken, type McpScope, type TokenRow, type TokenTtl } from "./model";

class McpBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  render() {
    if (this.state.error === null) return this.props.children;
    return <div role="alert" className="space-y-3 text-sm"><p>{mcpError(this.state.error)}</p><Button type="button" variant="outline" className="min-h-11" onClick={this.props.onRetry}>Coba lagi</Button></div>;
  }
}

/** Connected read is mounted only after client authentication and admin capability resolve. */
function McpAccessGate({ scope }: { scope: McpScope }) {
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  if (isLoading) return <p role="status" className="text-sm text-muted-foreground">Memeriksa akses MCP…</p>;
  if (!isAuthenticated) return <p className="text-sm">Masuk untuk mengelola token MCP. <Link className="inline-flex min-h-11 items-center text-primary underline" href="/masuk">Masuk</Link></p>;
  if (scope === "admin" && profile?.isPlatformAdmin !== true) return <p role="alert" className="text-sm">Akun ini tidak memiliki akses MCP admin.</p>;
  return <McpAccessPanel key={`${scope}:${profile?._id ?? "own-account"}`} scope={scope} />;
}

export function McpAccessView({ scope }: { scope: McpScope }) {
  const [retry, setRetry] = useState(0);
  return <McpBoundary key={`${scope}:${retry}`} onRetry={() => setRetry(value => value + 1)}><McpAccessGate scope={scope} /></McpBoundary>;
}

export function McpAccessPanel({ scope }: { scope: McpScope }) {
  const rows = useQuery(api.features.mcp.tokens.list, {}) as TokenRow[] | undefined;
  const actions = useMcpActions(scope);
  const [label, setLabel] = useState("");
  const [ttl, setTtl] = useState<TokenTtl>(30);
  const [fresh, setFresh] = useState<FreshToken | null>(null);
  const [target, setTarget] = useState<TokenRow | null>(null);
  const atLimit = (rows?.length ?? 0) >= 20;
  const disabled = actions.pending || rows === undefined || atLimit || fresh !== null;
  return <div className="min-w-0 space-y-6">
    <McpTokenSetup scope={scope} fresh={fresh} onHide={() => setFresh(null)} />
    <section aria-labelledby="mcp-create-title" className="space-y-3 border-b border-border pb-6">
      <h2 id="mcp-create-title" className="text-base font-semibold">Buat token {scope === "admin" ? "admin" : "user"}</h2>
      <p className="text-sm text-muted-foreground">Beri nama sesuai klien yang akan menggunakan token. Maksimal 20 token per akun; masa berlaku tidak diperpanjang otomatis.</p>
      <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" onSubmit={async event => {
        event.preventDefault();
        if (disabled || !label.trim()) return;
        const created = await actions.issue(label, ttl);
        if (created) { setFresh(created); setLabel(""); }
      }}>
        <div className="space-y-1.5"><label htmlFor="mcp-token-label" className="text-sm">Nama token</label><Input id="mcp-token-label" value={label} onChange={event => setLabel(event.target.value)} required maxLength={64} disabled={disabled} autoComplete="off" className="min-h-11" placeholder="Contoh: Cursor laptop" /></div>
        <div className="space-y-1.5"><label htmlFor="mcp-token-ttl" className="block text-sm">Masa berlaku</label><select id="mcp-token-ttl" value={ttl} disabled={disabled} onChange={event => setTtl(Number(event.target.value) as TokenTtl)} className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">{[7, 30, 90].map(days => <option key={days} value={days}>{days} hari</option>)}</select></div>
        <Button type="submit" className="min-h-11" disabled={disabled || !label.trim()} aria-busy={actions.pending}>{actions.pending ? "Memproses…" : "Buat token"}</Button>
      </form>
      {fresh ? <p role="status" className="text-sm text-muted-foreground">Simpan dan sembunyikan token baru sebelum membuat token berikutnya.</p> : null}
      {atLimit ? <p role="status" className="text-sm text-muted-foreground">Batas 20 token tercapai. Cabut token yang tidak digunakan terlebih dahulu.</p> : null}
      {actions.error && !target ? <p role="alert" className="text-sm text-destructive">{actions.error}</p> : null}
    </section>
    <section aria-labelledby="mcp-token-list-title" className="space-y-3">
      <h2 id="mcp-token-list-title" className="text-base font-semibold">Token {scope} milik Anda</h2>
      {rows === undefined ? <p role="status" className="text-sm text-muted-foreground">Memuat token…</p> : <McpTokenTable rows={rows.filter(row => row.scope === scope)} pending={actions.pending} onRevoke={row => { if (!actions.pending) { actions.clearError(); setTarget(row); } }} />}
    </section>
    <McpRevokeDialog target={target} pending={actions.pending} error={actions.error} onClose={() => { setTarget(null); actions.clearError(); }} onConfirm={async () => {
      if (!target || !await actions.revoke(target.tokenId)) return false;
      if (fresh?.tokenId === target.tokenId) setFresh(null);
      return true;
    }} />
  </div>;
}
