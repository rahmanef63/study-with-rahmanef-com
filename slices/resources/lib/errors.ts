// resources slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the mutation hook, map code → copy, toast via sonner).
import { ConvexError } from "convex/values";
import type { ResourcesCopy } from "../config/copy";
import type { ResourcesErrorCode } from "../types";

type ErrorData = { code?: ResourcesErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractResourcesError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED / RATE_LIMITED reuse
 * the server message when present (already user-facing, no internals per P0).
 */
export function resourcesErrorMessage(error: unknown, copy: ResourcesCopy): string {
  const { code, message } = extractResourcesError(error);
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
