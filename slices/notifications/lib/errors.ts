// notifications slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the mutation hook, map code → copy, toast via sonner).
import { ConvexError } from "convex/values";
import type { NotificationsCopy } from "../config/copy";
import type { NotificationsErrorCode } from "../types";

type ErrorData = { code?: NotificationsErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractNotificationsError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED reuses the server
 * message when present (already user-facing, no internals per P0).
 */
export function notificationsErrorMessage(
  error: unknown,
  copy: NotificationsCopy
): string {
  const { code, message } = extractNotificationsError(error);
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
