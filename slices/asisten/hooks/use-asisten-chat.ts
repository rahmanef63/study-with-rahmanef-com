"use client";
// asisten slice — hook chat (#35). Mengembalikan fungsi ber-signature seam
// appshell `capabilities.useChat`: (messages) => AsyncGenerator<string>.
// Action `ask` non-streaming (jawaban utuh), jadi generator "mengalirkan"
// jawaban per potongan kata di client — UX progresif tanpa httpAction.
// Identity STABIL (useCallback tanpa dep yang berubah) per kontrak capabilities.
import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { AsistenChatFn, AsistenErrorCode, AsistenMessage } from "../types";
import { MAX_MESSAGES } from "../config/limits";

/** Ambil kode kontrak dari pesan ConvexError (format {code, message}). */
export function asistenErrorCode(err: unknown): AsistenErrorCode | null {
  const msg = err instanceof Error ? err.message : String(err);
  for (const code of [
    "NOT_AUTHENTICATED",
    "NOT_AUTHORIZED",
    "NOT_FOUND",
    "VALIDATION_FAILED",
    "RATE_LIMITED",
  ] as const) {
    if (msg.includes(code)) return code;
  }
  return null;
}

/** Pecah teks jadi potongan kecil untuk efek mengetik (murni kosmetik). */
async function* streamText(text: string): AsyncGenerator<string> {
  const words = text.split(/(\s+)/);
  let buf = "";
  for (const w of words) {
    buf += w;
    if (buf.length >= 24) {
      yield buf;
      buf = "";
      await new Promise((r) => setTimeout(r, 15));
    }
  }
  if (buf.length > 0) yield buf;
}

export type UseAsistenChatOptions = {
  /** Id materi (string dari deep-link) — Alfa ikut membaca materinya. */
  lessonId?: string;
};

/**
 * Chat satu giliran: kirim riwayat (dibatasi MAX_MESSAGES terakhir), terima
 * jawaban Alfa sebagai stream potongan teks. Error DILEMPAR ke pemanggil —
 * pemetaan copy dilakukan konsumen (AsistenChatView / adaptor capabilities).
 */
export function useAsistenChat(options?: UseAsistenChatOptions): AsistenChatFn {
  const askAction = useAction(api.features.asisten.chat.ask);
  const lessonId = options?.lessonId;

  return useCallback(
    function chat(messages: AsistenMessage[]) {
      const bounded = messages.slice(-MAX_MESSAGES);
      async function* run(): AsyncGenerator<string> {
        const text: string = await askAction({
          messages: bounded.map((m) => ({ role: m.role, text: m.text })),
          ...(lessonId !== undefined ? { lessonId } : {}),
        });
        yield* streamText(text);
      }
      return run();
    },
    [askAction, lessonId]
  );
}
