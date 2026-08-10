// materi slice — ConvexError → Bahasa copy. Same shape as the posts slice's
// mapper; kept local because a cross-slice import for six strings would make
// posts a peer of every slice in the repo.
import { ConvexError } from "convex/values";
import type { MateriCopy } from "../config/copy";
import type { MateriErrorCode } from "../types";

type ErrorData = { code?: MateriErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractMateriError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * True when the read failed because the materi is not visible to this viewer —
 * unknown id, deleted row, or a DRAFT below instructor level (the server
 * answers NOT_FOUND for all three, on purpose: a 404-vs-403 difference is an
 * existence oracle).
 */
export function isMateriMissing(error: unknown): boolean {
  return extractMateriError(error).code === "NOT_FOUND";
}

/** Map an error to user-facing copy. VALIDATION_FAILED reuses the server
 *  sentence when it has one (already user-facing per P0). */
export function materiErrorMessage(error: unknown, copy: MateriCopy): string {
  const { code, message } = extractMateriError(error);
  switch (code) {
    case "NOT_AUTHENTICATED":
      return copy.errNotAuthenticated;
    case "NOT_AUTHORIZED":
      return copy.errNotAuthorized;
    case "NOT_FOUND":
      return copy.errNotFound;
    case "VALIDATION_FAILED":
      return message ?? copy.errUnknown;
    default:
      return copy.errUnknown;
  }
}
