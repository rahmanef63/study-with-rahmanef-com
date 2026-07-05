// Slice public barrel — re-exports only (rr naming: index.ts is never
// implementation). This is the contract consumers rely on; covered by
// __tests__/barrel.test.ts.

export {
  ProfileSettingsForm,
  type ProfileSettingsFormProps,
} from "./components/profile-settings-form";
export {
  ProfileSettingsView,
  type ProfileSettingsViewProps,
} from "./components/profile-settings-view";

export { useCurrentProfile } from "./hooks/use-current-profile";
export type { UseCurrentProfileResult } from "./hooks/use-current-profile";
export {
  profileErrorCode,
  useCheckUsername,
  useEnsureProfile,
  useEnsureProfileOnFirstLogin,
  useUpdateProfile,
} from "./hooks/use-profile-mutations";

export { profilesFeature } from "./config";
export { DEFAULT_PROFILE_LABELS } from "./config/labels";

// Username rules — same functions the server enforces (SSOT in the convex
// feature; pure module, safe for the client bundle).
export {
  isValidUsername,
  normalizeUsername,
  USERNAME_MAX,
  USERNAME_MIN,
} from "@convex/features/profiles/username";

export {
  AVATAR_URL_MAX,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  PROFILE_ERROR_CODES,
} from "./types";
export type {
  CurrentProfile,
  ProfileErrorCode,
  ProfileFormValues,
  ProfileLabels,
  UsernameCheck,
} from "./types";
