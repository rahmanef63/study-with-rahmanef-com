// tenants slice — ConvexError({ code }) → user-facing Bahasa copy.
import { ConvexError } from "convex/values";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { TenantsErrorCode } from "../types";

/** Extract the typed error code from an unknown thrown value. */
export function extractErrorCode(err: unknown): TenantsErrorCode | "UNKNOWN" {
  if (err instanceof ConvexError) {
    const data: unknown = err.data;
    if (typeof data === "object" && data !== null && "code" in data) {
      const code = (data as { code: unknown }).code;
      if (typeof code === "string") return code as TenantsErrorCode;
    }
  }
  return "UNKNOWN";
}

/** Map an unknown error to display copy (overridable via a labels prop). */
export function errorToCopy(
  err: unknown,
  labels: Record<string, string> = DEFAULT_TENANT_LABELS.errors
): string {
  const code = extractErrorCode(err);
  return labels[code] ?? labels.UNKNOWN ?? DEFAULT_TENANT_LABELS.errors.UNKNOWN;
}
