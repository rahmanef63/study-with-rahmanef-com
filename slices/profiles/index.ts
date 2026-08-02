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

// Public profile page /u/[username] + badge wall (STATUS #9, v1.1).
export {
  PublicProfileView,
  type PublicProfileViewProps,
} from "./components/public-profile-view";
export {
  PublicProfileCard,
  type PublicProfileCardProps,
} from "./components/public-profile-card";
export { BadgeWall, type BadgeWallProps } from "./components/badge-wall";
export { ProfileAvatar, type ProfileAvatarProps } from "./components/profile-avatar";

// Public certificate page /sertifikat/<completionId> (STATUS #24, v1.3).
export {
  CertificateView,
  type CertificateViewProps,
} from "./components/certificate-view";
export {
  CertificateCard,
  type CertificateCardProps,
} from "./components/certificate-card";

export { useCurrentProfile } from "./hooks/use-current-profile";
export type { UseCurrentProfileResult } from "./hooks/use-current-profile";
export { usePublicProfile } from "./hooks/use-public-profile";
export { useCertificate } from "./hooks/use-certificate";
export {
  profileErrorCode,
  useCheckUsername,
  useEnsureProfile,
  useEnsureProfileOnFirstLogin,
  useUpdateProfile,
} from "./hooks/use-profile-mutations";

export { profilesFeature } from "./config";
export { DEFAULT_PROFILE_LABELS } from "./config/labels";
export { DEFAULT_PUBLIC_PROFILE_LABELS } from "./config/public-labels";
export { DEFAULT_CERTIFICATE_LABELS } from "./config/certificate-labels";

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
  Badge,
  Certificate,
  CertificateData,
  CertificateLabels,
  CurrentProfile,
  ProfileErrorCode,
  ProfileFormValues,
  ProfileLabels,
  PublicProfile,
  PublicProfileData,
  PublicProfileLabels,
  UsernameCheck,
} from "./types";
