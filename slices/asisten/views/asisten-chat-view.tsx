"use client";
// asisten slice — AsistenChatView (#35): jendela chat penuh dengan Alfa.
// Self-contained di atas useAsistenChat; host (os-shell) hanya menyuplai
// lessonId opsional + gate login (server tetap re-check semuanya).
// Riwayat hidup di state window (in-memory) — nol tabel baru, nol biaya simpan.
import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AsistenMessageBubble } from "../components/asisten-message";
import { mergeAsistenCopy, type AsistenCopyOverride } from "../config/copy";
import { MAX_TEXT } from "../config/limits";
import { asistenErrorCode, useAsistenChat } from "../hooks/use-asisten-chat";
import type { AsistenMessage } from "../types";

export type AsistenChatViewProps = {
  /** Id materi (deep-link) — Alfa membaca materinya sebagai konteks. */
  lessonId?: string;
  copy?: AsistenCopyOverride;
  className?: string;
};

export function AsistenChatView({ lessonId, copy: copyOverride, className }: AsistenChatViewProps) {
  const copy = mergeAsistenCopy(copyOverride);
  const chat = useAsistenChat({ lessonId });
  const [messages, setMessages] = useState<AsistenMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const errorText = useCallback(
    (err: unknown): string => {
      switch (asistenErrorCode(err)) {
        case "NOT_AUTHENTICATED":
          return copy.errNotAuthenticated;
        case "NOT_AUTHORIZED":
          return copy.errNotAuthorized;
        case "NOT_FOUND":
          return copy.errNotFound;
        case "VALIDATION_FAILED":
          return copy.errValidation;
        case "RATE_LIMITED":
          return copy.errRateLimited;
        default:
          return copy.errFallback;
      }
    },
    [copy]
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_TEXT);
      if (text.length === 0 || busy) return;
      const history: AsistenMessage[] = [...messages, { role: "user", text }];
      setMessages([...history, { role: "assistant", text: "" }]);
      setDraft("");
      setBusy(true);
      try {
        for await (const chunk of chat(history)) {
          setMessages((prev) =>
            prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: m.text + chunk } : m))
          );
        }
      } catch (err) {
        const note = errorText(err);
        setMessages((prev) =>
          prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: note } : m))
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, chat, errorText, messages]
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4">
          {lessonId ? (
            <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles aria-hidden className="size-3.5" />
              {copy.lessonContextBadge}
            </p>
          ) : null}
          {messages.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
              {copy.emptyHint}
            </p>
          ) : null}
          {messages.map((m, i) => (
            <AsistenMessageBubble key={i} message={m} pendingLabel={copy.thinking} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="mx-auto flex w-full max-w-2xl flex-wrap gap-2 px-4 pb-2">
          {copy.suggestions.map((s) => (
            <Button
              key={s}
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void send(s)}
              className="h-auto min-h-9 rounded-full px-3 py-1 text-xs font-normal text-muted-foreground"
            >
              {s}
            </Button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
        className="border-t bg-card/60 p-3"
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={copy.placeholder}
            aria-label={copy.placeholder}
            maxLength={MAX_TEXT}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="submit"
            aria-label={copy.send}
            disabled={busy || draft.trim().length === 0}
            className="min-h-11 shrink-0 gap-1.5"
          >
            <SendHorizonal aria-hidden className="size-4" />
            <span className="hidden @sm:inline">{copy.send}</span>
          </Button>
        </div>
        <p className="mx-auto mt-2 w-full max-w-2xl text-[11px] leading-snug text-muted-foreground">
          {copy.disclaimer}
        </p>
      </form>
    </div>
  );
}
