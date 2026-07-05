// Per-slice types (rr naming). Server-owned codes/limits re-exported from the
// convex feature so client copy mapping and server throws share one SSOT —
// @convex/* is an allowed import path (rr "barrel-only cross-slice imports").
import type { Doc } from "@convex/_generated/dataModel";

export {
  AVATAR_URL_MAX,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  PROFILE_ERROR_CODES,
} from "@convex/features/profiles/types";
export type { ProfileErrorCode, UsernameCheck } from "@convex/features/profiles/types";

/** Own-profile shape returned by getCurrentProfile (full doc — self read). */
export type CurrentProfile = Doc<"profiles">;

/** Controlled values of the settings form (empty string = cleared optional). */
export type ProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
};

/** Every user-facing string — props-driven, defaults in config/labels.ts. */
export type ProfileLabels = {
  title: string;
  subtitle: string;
  usernameLabel: string;
  usernameHelp: string;
  usernameChecking: string;
  usernameAvailable: string;
  usernameTaken: string;
  usernameInvalid: string;
  displayNameLabel: string;
  bioLabel: string;
  bioPlaceholder: string;
  avatarUrlLabel: string;
  avatarUrlHelp: string;
  save: string;
  saving: string;
  saved: string;
  signInPrompt: string;
  preparingProfile: string;
  errors: Record<import("@convex/features/profiles/types").ProfileErrorCode, string>;
  errorFallback: string;
};
