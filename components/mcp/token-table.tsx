"use client";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter,
  ResponsiveDialogHeader, ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { tokenDate, type TokenRow } from "./model";

export function McpTokenTable({ rows, pending, onRevoke }: { rows: TokenRow[]; pending: boolean; onRevoke: (row: TokenRow) => void }) {
  if (rows.length === 0) return <p className="py-5 text-sm text-muted-foreground">Belum ada token untuk scope ini. Buat token untuk menghubungkan klien AI.</p>;
  return <div role="region" aria-label="Daftar token MCP" tabIndex={0} className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Token milik akun Anda; nilai rahasia tidak ditampilkan.</caption>
      <thead className="border-b border-border text-xs text-muted-foreground"><tr>{["Nama dan scope", "Status", "Dibuat · WIB", "Kedaluwarsa · WIB", "Terakhir dipakai · WIB", "Tindakan"].map(title => <th key={title} scope="col" className="px-3 py-3">{title}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.tokenId} className="border-b border-border align-top">
        <td className="min-w-36 max-w-60 break-words px-3 py-3"><span className="font-medium">{row.label}</span><span className="block text-xs text-muted-foreground">{row.scope}</span></td>
        <td className="px-3 py-3">{row.expired ? "Kedaluwarsa" : "Aktif"}</td>
        <td className="px-3 py-3 tabular-nums">{tokenDate(row.createdAt)}</td><td className="px-3 py-3 tabular-nums">{tokenDate(row.expiresAt)}</td>
        <td className="px-3 py-3 tabular-nums">{tokenDate(row.lastUsedAt)}</td>
        <td className="px-3 py-3"><Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={() => onRevoke(row)} aria-label={`Cabut token ${row.label}`}>Cabut</Button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function McpRevokeDialog({ target, pending, error, onClose, onConfirm }: { target: TokenRow | null; pending: boolean; error?: string | null; onClose: () => void; onConfirm: () => Promise<boolean> }) {
  return <ResponsiveDialog open={target !== null} onOpenChange={open => { if (!open && !pending) onClose(); }} variant="alert" size="sm">
    <ResponsiveDialogHeader><ResponsiveDialogTitle className="break-words">Cabut token “{target?.label}”?</ResponsiveDialogTitle></ResponsiveDialogHeader>
    <ResponsiveDialogBody><p className="text-sm text-muted-foreground">Klien yang menggunakan token ini kehilangan akses pada panggilan berikutnya. Pencabutan tidak dapat dibatalkan.</p>{error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}</ResponsiveDialogBody>
    <ResponsiveDialogFooter>
      <Button type="button" variant="outline" className="min-h-11" disabled={pending} onClick={onClose}>Batal</Button>
      <Button type="button" variant="destructive" className="min-h-11" disabled={pending} aria-busy={pending} onClick={async () => { if (!pending && await onConfirm()) onClose(); }}>{pending ? "Mencabut…" : "Cabut token"}</Button>
    </ResponsiveDialogFooter>
  </ResponsiveDialog>;
}
