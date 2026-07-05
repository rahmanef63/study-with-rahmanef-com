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

/**
 * Mirrors the server-side `validatePasswordRequirements` in
 * `convex/features/auth/auth.ts`. Run client-side before the round-trip
 * so users see the reason instantly (no waiting on the WebSocket action).
 *
 * Returns null = valid; string = error reason in the same wording as the
 * server, so the message is consistent whichever side detects the issue.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long (max 128)";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain a letter and a digit";
  }
  return null;
}

/**
 * Browser autofill occasionally drops the email value into the password
 * field on multi-form pages that lack explicit autocomplete hints. Catch
 * the obvious case (an `@` in what should be a password) before signIn
 * so the user gets a clear local message instead of a server-side
 * "wrong password" red herring.
 */
export function looksLikeAutofillBug(password: string): boolean {
  return password.includes("@");
}
