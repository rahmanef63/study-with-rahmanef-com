// asisten feature — bounds + input validation (#35). SEMUA baca/kirim dibatasi
// konstanta di sini (P0 bounded; UI meniru via slices/asisten/config/limits.ts).
// Keputusan owner 2026-07-16: TANPA kuota per-user di v1 — pengaman biaya yang
// tetap ada: cap panjang/riwayat per request + max_tokens jawaban + kill-switch
// global (unset ANTHROPIC_API_KEY). Kuota harian = upgrade path (RATE_LIMITED
// sudah dicadangkan di kontrak error).
import { fail } from "./errors";

/** Riwayat maksimum yang dikirim per request (turn lama dipotong di client). */
export const MAX_MESSAGES = 20;
/** Panjang maksimum satu pesan (karakter). */
export const MAX_TEXT = 4000;
/** Potongan konteks materi (contentMd) yang disematkan ke system prompt. */
export const LESSON_CONTEXT_MAX = 8000;
/** Batas token jawaban model (pengaman biaya per request). */
export const MAX_OUTPUT_TOKENS = 1024;
/** Model default — termurah yang masih bagus untuk tutor teks. */
export const MODEL = "claude-haiku-4-5-20251001";

export type WireMessage = { role: "user" | "assistant"; text: string };

/** Validasi riwayat chat dari client. Turn kosong/kepanjangan → VALIDATION_FAILED. */
export function assertMessages(messages: WireMessage[]): void {
  if (messages.length === 0 || messages.length > MAX_MESSAGES) {
    fail("VALIDATION_FAILED", `Riwayat chat harus 1–${MAX_MESSAGES} pesan`);
  }
  for (const m of messages) {
    const t = m.text.trim();
    if (t.length === 0 || t.length > MAX_TEXT) {
      fail("VALIDATION_FAILED", `Tiap pesan harus 1–${MAX_TEXT} karakter`);
    }
  }
  if (messages[messages.length - 1].role !== "user") {
    fail("VALIDATION_FAILED", "Pesan terakhir harus dari pengguna");
  }
}

/**
 * Anthropic Messages API menuntut giliran user/assistant yang rapi — gabungkan
 * pesan beruntun dengan role sama & pastikan mulai dari user.
 */
export function coalesceTurns(messages: WireMessage[]): WireMessage[] {
  const out: WireMessage[] = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    if (last !== undefined && last.role === m.role) {
      last.text = `${last.text}\n\n${m.text}`;
    } else {
      out.push({ role: m.role, text: m.text });
    }
  }
  while (out.length > 0 && out[0].role !== "user") out.shift();
  return out;
}
