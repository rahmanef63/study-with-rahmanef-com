// announcements slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the mutation hook, map code → copy, toast via sonner).
import { ConvexError } from "convex/values";
import type { AnnouncementsCopy } from "../config/copy";
import type { AnnouncementsErrorCode } from "../types";

type ErrorData = { code?: AnnouncementsErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractAnnouncementsError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED reuses the server
 * message (already user-facing, no internals per P0 rules).
 */
export function announcementErrorMessage(error: unknown, copy: AnnouncementsCopy): string {
  const { code, message } = extractAnnouncementsError(error);
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
