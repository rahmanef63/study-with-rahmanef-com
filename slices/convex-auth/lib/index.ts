// Pure helpers shared by the sign-in page + any consumer code that wants
// the same validation rules. All functions are deterministic / side-effect
// free; they belong here, not in `hooks/`.

/**
 * Convex wraps every handler throw as
 *   `[Request ID: ...] Server Error\nUncaught Error: <real message>`
 *
 * Without unwrapping, the form would surface that wrapper as the user-facing
 * error string. Grab the real message so users see "Wrong password" instead
 * of "Server Error".
 */
export function extractAuthError(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";
  const msg = err.message ?? "";
  const match = msg.match(/Uncaught Error:\s*([^\n]+)/);
  if (match) return match[1].trim();
  const stripped = msg.replace(/^\[Request ID:[^\]]+\]\s*/, "").trim();
  return stripped || "Something went wrong. Please try again.";
}

/** Default user-facing strings. Bahasa Indonesia lives at the call site
 *  (AuthCard `labels` prop) so this slice stays copy-agnostic (rr P1). */
export const DEFAULT_LABELS = {
  title: "Sign in",
  description: "Continue with your Google account.",
  googleButton: "Continue with Google",
  googleButtonLoading: "Redirecting…",
  genericError: "Something went wrong. Please try again.",
} as const satisfies import("../types").SignInLabels;
