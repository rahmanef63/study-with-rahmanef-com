// leaderboard feature — the error-code union (rr-conventions "Error handling"
// / AGENTS.md §6). Deliberately TYPE-ONLY: this slice is read-only and has no
// input to validate, so every failure it can produce is thrown by the shared
// authz helpers (_shared/auth.ts) as ConvexError({ code, message }) —
// NOT_AUTHENTICATED / NOT_AUTHORIZED from requireTenantRole, NOT_FOUND from
// requireActiveTenantById. Adding a local `fail()` here would be dead code.
//
// The union is exported so a slices/leaderboard can map codes to Bahasa
// Indonesia copy exhaustively (precedent: slices/resources/types.ts re-exports
// ResourcesErrorCode from the Convex feature).
export type LeaderboardErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";
