// events feature — typed error codes (rr-conventions "Error handling" /
// AGENTS.md §6): always ConvexError({ code, message }), never a raw string, no
// internals and no PII in the message. Messages are user-facing Bahasa
// Indonesia; mirror the union client-side if a slices/events ships.
import { ConvexError } from "convex/values";

export type EventsErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

/** Throw a typed ConvexError. */
export function fail(code: EventsErrorCode, message: string): never {
  throw new ConvexError({ code, message });
}
