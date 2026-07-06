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

// --- Public etalase surface (STATUS #9, v1.1) ------------------------------
// These shapes are the EXPLICIT safe projections returned by the two anonymous
// `public*` queries (convex/features/profiles/public.ts). They deliberately
// exclude every internal/sensitive field — no `userId`, no `isPlatformAdmin`,
// no `_id`/`_creationTime` — so an anonymous caller never sees more than the
// public-profile fields sanctioned by AGENTS.md §6 + docs/DATA-MODEL.md.

/** Max badges read per profile — bounded take on courseCompletions.by_user. */
export const BADGE_TAKE = 100;

/**
 * Safe public projection of a profile (publicGetByUsername). Optionals are
 * coerced to `null` (never `undefined`) so the returned key set is STABLE and
 * exactly {username, displayName, bio, avatarUrl} — asserted in public.test.ts.
 */
export type PublicProfile = {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
};

/**
 * One earned badge = one courseCompletion, joined to its (published) course and
 * (active) tenant. `earnedAt` is the completion's `_creationTime` (epoch ms).
 * No ids leak — the wall is display-only and keyed by tenantSlug/courseSlug.
 */
export type Badge = {
  courseTitle: string;
  courseSlug: string;
  tenantSlug: string;
  earnedAt: number;
};
