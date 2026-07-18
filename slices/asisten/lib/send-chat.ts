// asisten slice — plain (non-hook) chat call. SSOT for the "call chat:ask +
// stream the answer" turn, shared by useAsistenChat (window-app / Inspector
// seam) AND lazy consumers: os-shell's alfa-chat dynamic-imports the barrel so
// the PARKED asisten feature stays out of the initial JS chunk entirely.
import type { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";
import { MAX_MESSAGES } from "../config/limits";
import type { AsistenMessage } from "../types";

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

/**
 * Chat satu giliran: kirim riwayat (dibatasi MAX_MESSAGES terakhir), terima
 * jawaban Alfa sebagai stream potongan teks. Error DILEMPAR ke pemanggil —
 * pemetaan copy dilakukan konsumen (AsistenChatView / adaptor capabilities).
 */
export async function* sendAsistenChat(
  client: ConvexReactClient,
  messages: AsistenMessage[],
  lessonId?: string,
): AsyncGenerator<string> {
  const bounded = messages.slice(-MAX_MESSAGES);
  const text: string = await client.action(api.features.asisten.chat.ask, {
    messages: bounded.map((m) => ({ role: m.role, text: m.text })),
    ...(lessonId !== undefined ? { lessonId } : {}),
  });
  yield* streamText(text);
}
