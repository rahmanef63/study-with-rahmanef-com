// Default labels for `<SignInPage>` — English. Consumers override via the
// `labels` prop (partial merge). Keep keys flat so a `{...DEFAULT, ...override}`
// spread is enough; no deep merge.

import type { SignInLabels } from "../types";

export const DEFAULT_LABELS: SignInLabels = {
  // Layout
  title: "Welcome",
  description: "Sign in or create an account to continue.",
  divider: "or",

  // Tabs
  loginTab: "Sign in",
  registerTab: "Sign up",

  // Fields
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordPlaceholderLogin: "••••••••",
  passwordPlaceholderRegister: "Min. 8 chars, letters + digit",
  passwordHint: "At least 8 characters, mixing letters and digits.",
  nameLabel: "Full name",
  namePlaceholder: "Jane Doe",
  forgotPassword: "Forgot password?",

  // Buttons
  loginButton: "Sign in",
  loginButtonLoading: "Signing in…",
  registerButton: "Create account",
  registerButtonLoading: "Creating account…",
  googleButton: "Continue with Google",
  googleButtonLoading: "Redirecting to Google…",
  anonymousButton: "Continue as guest",
  anonymousButtonLoading: "Starting guest session…",
  anonymousHint: "Private session · no signup · data clears on sign-out",
  anonymousTryHint: "Want to try it first?",
  magicLinkButton: "Send magic link",
  magicLinkButtonLoading: "Sending…",
  magicLinkHint: "We'll email you a one-tap sign-in link.",

  // Errors / notices
  autofillEmailInPasswordError:
    "Password field contains an email — check your browser autofill.",
  genericError: "Something went wrong. Please try again.",
};
