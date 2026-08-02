"use client";
// asisten slice — hook chat (#35). Mengembalikan fungsi ber-signature seam
// appshell `capabilities.useChat`: (messages) => AsyncGenerator<string>.
// Logika call+stream ada di lib/send-chat.ts (SSOT — juga dipakai lazy oleh
// os-shell alfa-chat); hook ini tinggal mengikat Convex client + lessonId.
// Identity STABIL (useCallback tanpa dep yang berubah) per kontrak capabilities.
import { useCallback } from "react";
import { useConvex } from "convex/react";
import type { AsistenChatFn, AsistenErrorCode, AsistenMessage } from "../types";
import { sendAsistenChat } from "../lib/send-chat";

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
  const client = useConvex();
  const lessonId = options?.lessonId;

  return useCallback(
    function chat(messages: AsistenMessage[]) {
      return sendAsistenChat(client, messages, lessonId);
    },
    [client, lessonId]
  );
}
