import { useFixtureParams } from "./next-adapter";
export { ProfileAvatar } from "../../slices/profiles/components/profile-avatar";
export function useCurrentProfile() {
  const role = useFixtureParams().get("role") ?? "admin";
  return { isLoading: role === "loading", isAuthenticated: role !== "anonymous", profile: role === "anonymous" || role === "loading" ? null : {
    username: "fixture-admin", displayName: "Administrator Fixture", avatarUrl: null, isPlatformAdmin: role === "admin",
  } };
}
