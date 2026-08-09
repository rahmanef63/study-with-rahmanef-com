// Slice public types — kept narrow so consumers can extend in their own
// barrels without re-declaring our shape. Google-only: the password /
// magic-link / phone / anonymous shapes went with the providers that were never
// registered server-side (convex/auth.ts).

/**
 * Result envelope from every auth flow in this slice. A discriminated union
 * (`ok`) so consumers can `if (result.ok)` and TS narrows.
 *
 * Convex errors get unwrapped through `extractAuthError()` before they land in
 * `result.error` — so the message is user-facing, not
 * `[Request ID: ...] Server Error\nUncaught Error: ...`.
 */
export type AuthResult = { ok: true } | { ok: false; error: string };

/** Provider menu. One entry today; see AuthCard's AuthMethod. */
export type AuthProvider = "google";

/** Every user-facing string the card renders. Defaults in `DEFAULT_LABELS`;
 *  consumers override via the `labels` prop (spread-merged at render time, so
 *  partial overrides work). */
export interface SignInLabels {
  title: string;
  description: string;
  googleButton: string;
  googleButtonLoading: string;
  genericError: string;
}
