// announcements feature — typed error codes (rr-conventions "Error handling"):
// always ConvexError({ code, message }), never raw strings, no internals/PII.
// Mirrored client-side in slices/announcements/types.ts — keep the union in sync.
import { ConvexError } from "convex/values";

export type AnnouncementsErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

/** Throw a typed ConvexError. Messages are user-facing Bahasa Indonesia. */
export function fail(code: AnnouncementsErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}
