// courses slice — ConvexError → user-facing copy (rr-conventions "Error
// handling": catch in the slice's mutation hook, map code → copy, toast).
import { ConvexError } from "convex/values";
import type { CoursesCopy } from "../config/copy";
import type { CoursesErrorCode } from "../types";

type ErrorData = { code?: CoursesErrorCode; message?: string };

/** Best-effort extraction of our typed { code, message } payload. */
export function extractCoursesError(error: unknown): ErrorData {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    return error.data as ErrorData;
  }
  return {};
}

/**
 * Map an error to Bahasa Indonesia copy. VALIDATION_FAILED reuses the
 * server message (already user-facing ID copy, no internals per P0 rules).
 */
export function coursesErrorMessage(error: unknown, copy: CoursesCopy): string {
  const { code, message } = extractCoursesError(error);
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
