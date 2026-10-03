"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Clipboard writes are explicit; denied permission keeps the visible value available. */
export function McpCopyButton({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState<string | null>(null);
  return <div className="space-y-1">
    <Button type="button" variant="outline" className="min-h-11" onClick={async () => {
      try { await navigator.clipboard.writeText(value); setMessage("Tersalin."); }
      catch { setMessage("Tidak dapat menyalin. Pilih dan salin teks secara manual."); }
    }}>{label}</Button>
    {message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}
  </div>;
}
