"use client";

/**
 * Production multi-provider sign-in page.
 *
 * Lifts the working sign-in pattern from CareerPack (2026-05-17 via
 * `/rr lift`). The previous stub (a single `<Card>` with a "wire to
 * signIn…" note) is replaced — backend was already production-grade,
 * frontend was the missing piece.
 *
 * What you get:
 * - Login / Register tabs (Password provider), same client-side validation
 *   as `convex/features/auth/auth.ts`'s `validatePasswordRequirements`.
 * - Optional Google OAuth button.
 * - Optional Anonymous "Continue as guest" — one click = one fresh user
 *   row, so concurrent visitors on the same machine never share state.
 * - Optional Resend magic-link form.
 * - i18n via the `labels` prop (`Partial<SignInLabels>`).
 *
 * This file owns layout + composition only. The Login/Register tabs live
 * in `password-forms.tsx`; OAuth + Anonymous + magic-link in
 * `auth-buttons.tsx`; field primitives in `fields.tsx`. Each file stays
 * under the slice's ≤200-LOC budget.
 */

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

import {
  AnonymousButton,
  GoogleButton,
  MagicLinkForm,
} from "./auth-buttons";
import { Divider } from "./auth-card-blocks";
import { PasswordForms } from "./password-forms";
import { useAuthFlow } from "../hooks";
import { DEFAULT_LABELS } from "../lib/labels";
import type {
  AuthProvider,
  AuthResult,
  SignInLabels,
  SignInPageProps,
} from "../types";

// "anonymous" is intentionally NOT a default — the backend copy-source no
// longer enables the Anonymous provider out of the box (it devalues every
// `requireUser` gate). Pass providers={[..., "anonymous"]} after opting in
// on the Convex side.
const DEFAULT_PROVIDERS: ReadonlyArray<AuthProvider> = [
  "password",
  "google",
];

export default function SignInPage({
  appName = "Your App",
  redirectTo = "/dashboard",
  forgotPasswordHref = "/forgot-password",
  providers = DEFAULT_PROVIDERS,
  labels: labelOverrides,
  footer,
  onSuccess,
}: SignInPageProps) {
  const router = useRouter();
  const flow = useAuthFlow();
  const labels: SignInLabels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [error, setError] = useState("");

  const handleSuccess = async (provider: AuthProvider) => {
    if (onSuccess) {
      await onSuccess(provider);
      return;
    }
    router.push(redirectTo);
  };

  const handleResult = async (
    result: AuthResult,
    provider: AuthProvider,
  ) => {
    if (result.ok) {
      setError("");
      await handleSuccess(provider);
    } else {
      setError(result.error || labels.genericError);
    }
  };

  const hasPassword = providers.includes("password");
  const hasGoogle = providers.includes("google");
  const hasAnonymous = providers.includes("anonymous");
  const hasMagicLink = providers.includes("magic-link");

  // Non-password buttons render above the tab stack. If `password` isn't
  // in the provider list, the divider is suppressed (it would dangle
  // otherwise).
  const showOAuthRow = hasGoogle || hasMagicLink;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-6">
      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {showOAuthRow ? (
            <div className="space-y-2">
              {hasGoogle ? (
                <GoogleButton
                  flow={flow.signInWithGoogle}
                  labels={labels}
                  onResult={(r) => handleResult(r, "google")}
                />
              ) : null}
              {hasMagicLink ? (
                <MagicLinkForm
                  send={flow.sendMagicLink}
                  labels={labels}
                  onResult={(r) => handleResult(r, "magic-link")}
                />
              ) : null}
            </div>
          ) : null}

          {showOAuthRow && hasPassword ? (
            <Divider text={labels.divider} />
          ) : null}

          {hasPassword ? (
            <PasswordForms
              flow={flow}
              labels={labels}
              forgotPasswordHref={forgotPasswordHref}
              showAnonymous={hasAnonymous}
              onAnonymous={async () => {
                const r = await flow.signInAnonymous();
                await handleResult(r, "anonymous");
              }}
              onResult={(r, provider) => handleResult(r, provider)}
            />
          ) : hasAnonymous ? (
            // Anonymous alone (no Password tabs) — render as a primary button.
            <AnonymousButton
              flow={flow.signInAnonymous}
              labels={labels}
              onResult={(r) => handleResult(r, "anonymous")}
            />
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {footer ?? <p>© {new Date().getFullYear()} {appName}</p>}
      </div>
    </main>
  );
}
