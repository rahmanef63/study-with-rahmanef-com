"use client";

/**
 * AuthCard — presentational, props-driven sign-in card.
 *
 * One component, many surfaces: pick which sign-in methods render via the
 * `methods` prop (order = render order), then call it as many times as you
 * like with different props. Pure presentation — every method takes an
 * async handler returning `AuthResult`; handlers default to a mock that
 * resolves `{ ok: true }` so the card is fully interactive in previews and
 * Storybook with zero wiring. In a real app, pass handlers wired to
 * `useAuthFlow()` (or render the full-page `<SignInPage>` instead).
 *
 * Layout: OAuth buttons (google/github) on top → divider → one field
 * method (password tabs / magic-link / phone OTP) → optional anonymous.
 */

import { useState, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

import { GoogleButton, MagicLinkForm, AnonymousButton } from "./auth-buttons";
import {
  Divider, GithubButton, PasswordBlock, PhoneForm,
  type PasswordMode, type PasswordSubmit,
} from "./auth-card-blocks";
import { DEFAULT_LABELS } from "../lib/labels";
import type { AuthResult, SignInLabels } from "../types";

export type AuthMethod =
  | "google" | "github" | "magic-link" | "password" | "phone" | "anonymous";

const ok: () => Promise<AuthResult> = async () => ({ ok: true });

export interface AuthCardProps {
  /** Methods to render, in order. Default: `["password", "google"]`. */
  methods?: ReadonlyArray<AuthMethod>;
  /** Password block initial tab. */
  defaultPasswordMode?: PasswordMode;
  title?: string;
  description?: string;
  labels?: Partial<SignInLabels>;
  footer?: ReactNode;
  className?: string;
  /** Forgot-password link target; `null` hides it. */
  forgotPasswordHref?: string | null;
  // Handlers — all optional; default to a mock that resolves ok.
  onGoogle?: () => Promise<AuthResult>;
  onGithub?: () => Promise<AuthResult>;
  onMagicLink?: (email: string) => Promise<AuthResult>;
  onPassword?: PasswordSubmit;
  onPhoneSend?: (phone: string) => Promise<AuthResult>;
  onPhoneVerify?: (phone: string, code: string) => Promise<AuthResult>;
  onAnonymous?: () => Promise<AuthResult>;
  /** Fired after any successful method. */
  onSuccess?: (method: AuthMethod) => void;
}

export function AuthCard({
  methods = ["password", "google"],
  defaultPasswordMode = "signin",
  title, description, labels: overrides, footer, className,
  forgotPasswordHref = "/forgot-password",
  onGoogle = ok, onGithub = ok, onMagicLink, onPassword,
  onPhoneSend, onPhoneVerify, onAnonymous = ok, onSuccess,
}: AuthCardProps) {
  const labels: SignInLabels = { ...DEFAULT_LABELS, ...overrides };
  const [error, setError] = useState("");
  const has = (m: AuthMethod) => methods.includes(m);

  const handle = (r: AuthResult, m: AuthMethod) => {
    if (r.ok) { setError(""); onSuccess?.(m); } else setError(r.error || labels.genericError);
  };

  const oauth = has("google") || has("github");
  const fieldMethod = has("password") || has("magic-link") || has("phone");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title ?? labels.title}</CardTitle>
        <CardDescription>{description ?? labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : null}

        {oauth ? (
          <div className="space-y-2">
            {has("google") ? (
              <GoogleButton flow={onGoogle} labels={labels} onResult={(r) => handle(r, "google")} />
            ) : null}
            {has("github") ? (
              <GithubButton flow={onGithub} onResult={(r) => handle(r, "github")} />
            ) : null}
          </div>
        ) : null}

        {oauth && fieldMethod ? <Divider text={labels.divider} /> : null}

        {has("password") ? (
          <PasswordBlock
            labels={labels}
            forgotPasswordHref={forgotPasswordHref}
            defaultMode={defaultPasswordMode}
            onSubmit={onPassword ?? ok}
            onResult={(r) => handle(r, "password")}
          />
        ) : null}

        {has("magic-link") ? (
          <MagicLinkForm
            send={onMagicLink ?? (async () => ({ ok: true }))}
            labels={labels}
            onResult={(r) => handle(r, "magic-link")}
          />
        ) : null}

        {has("phone") ? (
          <PhoneForm
            onSend={onPhoneSend ?? (async () => ({ ok: true }))}
            onVerify={onPhoneVerify ?? (async () => ({ ok: true }))}
            onResult={(r) => handle(r, "phone")}
          />
        ) : null}

        {has("anonymous") ? (
          <div className={fieldMethod ? "border-t pt-4" : undefined}>
            <AnonymousButton flow={onAnonymous} labels={labels} onResult={(r) => handle(r, "anonymous")} />
          </div>
        ) : null}
      </CardContent>

      {footer ? (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </Card>
  );
}
