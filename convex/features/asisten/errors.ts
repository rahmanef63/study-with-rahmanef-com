// asisten feature — typed error codes (rr-conventions "Error handling"):
// always ConvexError({ code, message }), never raw strings, no internals/PII.
// Mirrored client-side via slices/asisten/types.ts — keep the union in sync.
// NOTE: kunci API yang belum di-set dilaporkan sebagai NOT_FOUND ("asisten
// belum aktif") — bukan detail konfigurasi server yang bocor ke client.
import { ConvexError } from "convex/values";

export type AsistenErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

/** Throw a typed ConvexError. Messages are user-facing Bahasa Indonesia. */
export function fail(code: AsistenErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}
