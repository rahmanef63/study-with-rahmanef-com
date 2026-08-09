// posts slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the mutation hook, map code → copy, toast via sonner).
//
// RATE_LIMITED matters here more than anywhere else in the app: the daily post
// cap WILL be hit (10 posts/day, 3 with a link — convex/features/posts/
// antiSpam.ts), and the server already phrases it as friendly Bahasa. Reuse
// that message; never surface the bare code.
import { ConvexError } from "convex/values";
import type { PostsCopy } from "../config/copy";
import type { PostsErrorCode } from "../types";

type ErrorData = { code?: PostsErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractPostsError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/** True when the failure was the daily cap — lets a surface soften its tone. */
export function isRateLimited(error: unknown): boolean {
  return extractPostsError(error).code === "RATE_LIMITED";
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED / RATE_LIMITED reuse
 * the server message when present (already user-facing, no internals per P0).
 */
export function postsErrorMessage(error: unknown, copy: PostsCopy): string {
  const { code, message } = extractPostsError(error);
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
