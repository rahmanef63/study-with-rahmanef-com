// comments slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the mutation hook, map code → copy, toast via sonner).
import { ConvexError } from "convex/values";
import type { CommentsCopy } from "../config/copy";
import type { CommentsErrorCode } from "../types";

type ErrorData = { code?: CommentsErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractCommentsError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED / RATE_LIMITED
 * reuse the server message when present (already user-facing, no internals
 * per P0).
 */
export function commentsErrorMessage(error: unknown, copy: CommentsCopy): string {
  const { code, message } = extractCommentsError(error);
  switch (code) {
    case "NOT_AUTHENTICATED":
      return copy.errNotAuthenticated;
    case "NOT_AUTHORIZED":
      return copy.errNotAuthorized;
    case "NOT_FOUND":
      return copy.errNotFound;
    case "RATE_LIMITED":
      return message ?? copy.errRateLimited;
    case "VALIDATION_FAILED":
      return message ?? copy.errUnknown;
    default:
      return copy.errUnknown;
  }
}
