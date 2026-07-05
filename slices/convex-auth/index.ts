// Slice public barrel — re-exports only.

export { AuthCard, type AuthCardProps, type AuthMethod } from "./components/AuthCard";
export { default as SignInPage } from "./components/sign-in-page";
export { useAuthFlow } from "./hooks";
export {
  extractAuthError,
  looksLikeAutofillBug,
  validatePassword,
} from "./lib";
export { DEFAULT_LABELS } from "./lib/labels";
export type {
  AuthProvider,
  AuthResult,
  PasswordCredentials,
  RegisterCredentials,
  SignInLabels,
  SignInPageProps,
} from "./types";
