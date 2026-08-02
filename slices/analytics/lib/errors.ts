// analytics slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": map code → copy; VALIDATION_FAILED reuses the server message,
// already user-facing per P0 rules). Pattern: slices/progress/lib/errors.ts.
import { ConvexError } from "convex/values";
import type { AnalyticsCopy } from "../config/copy";
import type { AnalyticsErrorCode } from "../types";

type ErrorData = { code?: AnalyticsErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractAnalyticsError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/** Map an error to Bahasa Indonesia copy. */
export function analyticsErrorMessage(error: unknown, copy: AnalyticsCopy): string {
  const { code, message } = extractAnalyticsError(error);
  switch (code) {
    case "NOT_AUTHENTICATED":
      return copy.errNotAuthenticated;
    case "NOT_AUTHORIZED":
      return copy.errNotAuthorized;
    case "NOT_FOUND":
      return copy.errNotFound;
    case "RATE_LIMITED":
      return copy.errRateLimited;
    case "VALIDATION_FAILED":
      return message ?? copy.errUnknown;
    default:
      return copy.errUnknown;
  }
}
