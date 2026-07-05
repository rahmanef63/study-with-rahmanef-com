// Pure username rules — shared by server (mutations/queries) and client (form
// hints) via the slice barrel. Zero Convex imports so the client bundle stays
// clean. Contract (docs/AGENT-PROMPTS.md #4): globally unique, lowercase
// kebab-case; collisions on explicit user input reject VALIDATION_FAILED.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

// Combining diacritical marks (U+0300–U+036F), as escapes for source clarity.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Normalize arbitrary input to lowercase kebab-case:
 * diacritics stripped, any non [a-z0-9] run collapses to a single hyphen,
 * no leading/trailing hyphen, hard cap at USERNAME_MAX.
 * May return a string shorter than USERNAME_MIN — callers must validate.
 */
export function normalizeUsername(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, USERNAME_MAX)
    .replace(/-+$/g, "");
}

/** True iff `username` is already in canonical form and within length bounds. */
export function isValidUsername(username: string): boolean {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return false;
  if (username.includes("--")) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(username);
}

/**
 * Ordered username candidates derived from auth account data (Google):
 * display name → email local part. Invalid/short results are filtered out;
 * `fallback` guarantees the list is never empty.
 */
export function usernameCandidates(
  name: string | undefined,
  email: string | undefined,
  fallback = "pengguna"
): string[] {
  const candidates = [name, email?.split("@")[0]]
    .map((source) => (source ? normalizeUsername(source) : ""))
    .filter((candidate) => isValidUsername(candidate));
  return candidates.length > 0 ? candidates : [fallback];
}
