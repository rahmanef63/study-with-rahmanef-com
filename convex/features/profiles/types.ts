// Error codes + field limits for the profiles feature. The slice frontend
// re-exports these through its barrel (slices/profiles/types.ts) so client
// copy mapping and server throws share one source of truth.

export const PROFILE_ERROR_CODES = [
  "NOT_AUTHENTICATED",
  "NOT_AUTHORIZED",
  "NOT_FOUND",
  "VALIDATION_FAILED",
  "RATE_LIMITED",
] as const;

export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[number];

export const DISPLAY_NAME_MAX = 80;
export const BIO_MAX = 500;
export const AVATAR_URL_MAX = 500;

/** Shape returned by checkUsername — availability probe for the settings form. */
export type UsernameCheck = {
  normalized: string;
  valid: boolean;
  available: boolean;
};
