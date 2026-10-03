"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { McpCopyButton } from "./copy-button";
import { mcpConfiguration, mcpEndpoint, tokenDate, type FreshToken, type McpScope } from "./model";

export function McpTokenSetup({ scope, fresh, onHide }: { scope: McpScope; fresh: FreshToken | null; onHide: () => void }) {
  return <div className="space-y-6">
    {fresh ? <section aria-label="Token baru" className="space-y-3 border-l-4 border-primary bg-muted/30 p-4">
      <h2 className="text-base font-semibold">Simpan token sekarang</h2>
      <p className="text-sm text-muted-foreground">Token hanya ditampilkan setelah dibuat. Setelah disembunyikan atau meninggalkan halaman, nilainya tidak dapat dilihat kembali. Berlaku sampai {tokenDate(fresh.expiresAt)} WIB.</p>
      <label className="block text-sm" htmlFor="mcp-new-token">Bearer token</label>
      <Textarea id="mcp-new-token" readOnly autoFocus value={fresh.token} rows={3} spellCheck={false} autoComplete="off" className="break-all font-mono text-xs" />
      <div className="flex flex-wrap gap-3"><McpCopyButton value={fresh.token} label="Salin token" /><Button type="button" variant="ghost" className="min-h-11" onClick={onHide}>Sudah disimpan, sembunyikan</Button></div>
    </section> : null}
    <section aria-labelledby="mcp-setup-title" className="space-y-3 border-b border-border pb-6">
      <h2 id="mcp-setup-title" className="text-base font-semibold">Hubungkan klien AI</h2>
      <p className="text-sm text-muted-foreground">Gunakan URL berikut dengan autentikasi Bearer. Ganti TOKEN_BARU_ANDA dalam contoh konfigurasi dengan token yang baru dibuat.</p>
      <p className="break-all font-mono text-sm">{mcpEndpoint(scope)}</p>
      <McpCopyButton value={mcpEndpoint(scope)} label="Salin URL MCP" />
      <pre tabIndex={0} aria-label="Contoh konfigurasi MCP" className="max-w-full overflow-x-auto border border-border bg-muted/30 p-3 text-xs">{mcpConfiguration(scope)}</pre>
      <McpCopyButton value={mcpConfiguration(scope)} label="Salin contoh konfigurasi" />
      <p className="text-sm text-muted-foreground">Setelah terhubung, muat ulang daftar tools atau actions pada klien. Tools penemuan kapabilitas dan eksekusi memakai kontrak tetap; akses setiap panggilan mengikuti scope token, peran terkini, dan masa berlaku.</p>
      <p className="text-sm text-muted-foreground">{scope === "admin" ? "Scope admin memerlukan platform admin dan dapat mengakses statistik serta operasi administratif yang tersedia." : "Scope user mengikuti akun dan keanggotaan komunitas Anda. Token ini tidak memberi akses platform admin."} Pencabutan memutus akses pada panggilan berikutnya. Jangan membagikan token atau menaruhnya di URL.</p>
    </section>
  </div>;
}
