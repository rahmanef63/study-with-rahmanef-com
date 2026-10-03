"use client";
import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkdownCodeBlock({ text, lang }: { text: string; lang?: string }) {
  const [copied, setCopied] = useState<{ text: string; status: "copied" | "failed" } | null>(null);
  const status = copied?.text === text ? copied.status : "idle";
  const busy = useRef(false);
  const copy = async () => {
    if (busy.current) return;
    busy.current = true;
    try { await navigator.clipboard.writeText(text); setCopied({ text, status: "copied" }); }
    catch { setCopied({ text, status: "failed" }); }
    finally { busy.current = false; }
  };
  return <div className="my-3 min-w-0 overflow-hidden rounded-md border border-border bg-muted/70">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-1"><span className="break-words text-xs text-muted-foreground">Kode{lang ? ` · ${lang}` : ""}</span><Button variant="ghost" className="min-h-11" onClick={copy}>{status === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{status === "copied" ? "Tersalin" : "Salin kode"}</Button></div>
    {status === "failed" ? <p role="status" className="px-3 pt-2 text-xs text-muted-foreground">Tidak dapat menyalin. Pilih teks kode lalu salin secara manual.</p> : null}
    <pre role="region" aria-label={lang ? `Kode ${lang}` : "Kode"} tabIndex={0} translate="no" className="notranslate max-h-[36rem] overflow-auto p-3 text-xs focus-visible:outline-2 focus-visible:outline-ring"><code translate="no" className="font-mono">{text}</code></pre>
  </div>;
}
