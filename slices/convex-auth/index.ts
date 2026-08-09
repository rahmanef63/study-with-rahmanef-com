// Slice public barrel — re-exports only.

export { AuthCard, type AuthCardProps, type AuthMethod } from "./components/AuthCard";
export { useAuthFlow } from "./hooks";
export { DEFAULT_LABELS, extractAuthError } from "./lib";
export type { AuthProvider, AuthResult, SignInLabels } from "./types";
