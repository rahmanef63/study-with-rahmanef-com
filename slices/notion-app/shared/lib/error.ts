/** Minimal error sanitizer for the notion cluster — trimmed from
 *  notion-page-clone `shared/lib/error.ts`. Returns a user-safe message
 *  (no stack, no internal identifiers); logs the raw error in dev only. */

export interface SanitizedError {
  message: string;
}

/** Extract a human-readable message from an unknown thrown value. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return fallback;
}

export function reportError(context: string, err: unknown): SanitizedError {
  if (process.env.NODE_ENV !== "production") {

    console.error(`[${context}]`, err);
  }
  return { message: getErrorMessage(err) };
}
