// asisten slice — client types. Kode error server di-mirror (SSOT tetap di
// convex/features/asisten/errors.ts — keep in sync).

export type AsistenErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

/** Satu giliran chat di UI dan di wire (shape sama dengan action `ask`). */
export type AsistenMessage = { role: "user" | "assistant"; text: string };

/** Fungsi chat — kompatibel dengan seam appshell `capabilities.useChat`. */
export type AsistenChatFn = (messages: AsistenMessage[]) => AsyncGenerator<string>;
