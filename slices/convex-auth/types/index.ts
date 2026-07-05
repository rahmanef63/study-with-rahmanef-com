// Slice public types — kept narrow so consumers can extend in their own
// barrels without re-declaring our shape.

import type { ReactNode } from "react";

/**
 * Result envelope from every auth flow in this slice. Use a discriminated
 * union (`ok`) so consumers can `if (result.ok)` and TS narrows.
 *
 * Convex errors get unwrapped through `extractAuthError()` before they
 * land in `result.error` — so the message is user-facing, not
 * `[Request ID: ...] Server Error\nUncaught Error: ...`.
 */
export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

export interface PasswordCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends PasswordCredentials {
  name?: string;
}

/**
 * Provider menu. Consumers pick which ones the page exposes via the
 * `providers` prop on `<SignInPage>`. Order in the prop array == order
 * rendered on screen.
 *
 * - `password`: email + password, login + register tabs (default flow).
 * - `magic-link`: passwordless email via Resend.
 * - `google`: Google OAuth.
 * - `anonymous`: one-tap guest session (creates an Anonymous user row).
 */
export type AuthProvider =
  | "password"
  | "magic-link"
  | "google"
  | "anonymous";

/**
 * Every user-facing string the page renders. Defaulted to English in
 * `DEFAULT_LABELS` (`./labels.ts`); consumers override via the `labels`
 * prop. Spread-merged at render time so partial overrides work.
 */
export interface SignInLabels {
  // Layout
  title: string;
  description: string;
  divider: string;

  // Tabs
  loginTab: string;
  registerTab: string;

  // Fields
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholderLogin: string;
  passwordPlaceholderRegister: string;
  passwordHint: string;
  nameLabel: string;
  namePlaceholder: string;
  forgotPassword: string;

  // Buttons
  loginButton: string;
  loginButtonLoading: string;
  registerButton: string;
  registerButtonLoading: string;
  googleButton: string;
  googleButtonLoading: string;
  anonymousButton: string;
  anonymousButtonLoading: string;
  anonymousHint: string;
  anonymousTryHint: string;
  magicLinkButton: string;
  magicLinkButtonLoading: string;
  magicLinkHint: string;

  // Errors / notices
  autofillEmailInPasswordError: string;
  genericError: string;
}

export interface SignInPageProps {
  /**
   * Brand name rendered in the footer. Skip if you pass a custom `footer`.
   * Default: "Your App".
   */
  appName?: string;

  /**
   * Path the page navigates to after a successful sign-in / sign-up.
   * Default: `"/dashboard"`. Pass `onSuccess` to override navigation
   * entirely (e.g. for modal flows).
   */
  redirectTo?: string;

  /**
   * Where the "forgot password?" link points. Pass `null` to hide it.
   * Default: `"/forgot-password"`.
   */
  forgotPasswordHref?: string | null;

  /**
   * Provider list, in render order. `password` shows the Login/Register
   * tabs; `magic-link`, `google`, `anonymous` render their own buttons.
   * Default: `["password", "google"]` — `anonymous` is opt-in (enable the
   * Anonymous provider on the Convex side first).
   */
  providers?: ReadonlyArray<AuthProvider>;

  /**
   * Partial label overrides for i18n. Unspecified keys fall through to
   * `DEFAULT_LABELS`.
   */
  labels?: Partial<SignInLabels>;

  /**
   * Custom footer node. If omitted, a copyright line using `appName`
   * renders.
   */
  footer?: ReactNode;

  /**
   * Called after any successful sign-in / sign-up. If present, this
   * runs instead of the default `router.push(redirectTo)` so consumers
   * can do their own navigation (e.g. server action, modal close).
   */
  onSuccess?: (provider: AuthProvider) => void | Promise<void>;
}
