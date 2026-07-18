// profiles slice — hooks sub-barrel (re-exports only), a LIGHT public entry
// beside the full barrel (../index.ts). Eager OS-shell chrome (account menu,
// notifications bell gate, alfa-chat) imports from here so the barrel's views
// (settings/public profile/certificate) never enter the initial JS chunk
// (see docs/SLICES.md "Light entries").
export {
  useCurrentProfile,
  type UseCurrentProfileResult,
} from "./use-current-profile";
export { usePublicProfile } from "./use-public-profile";
export { useCertificate } from "./use-certificate";
export {
  profileErrorCode,
  useCheckUsername,
  useEnsureProfile,
  useEnsureProfileOnFirstLogin,
  useUpdateProfile,
} from "./use-profile-mutations";
