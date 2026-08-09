"use client";

/**
 * AuthCard — presentational, props-driven sign-in card.
 *
 * Google-only. The upstream rr slice shipped six methods (password, magic-link,
 * phone OTP, github, anonymous); convex/auth.ts registers ONLY Google
 * (PRD R1 / DECISIONS #15), so every other branch threw at runtime and was
 * unreachable dead weight. Adding a provider later = register it server-side
 * first, then add a branch here.
 *
 * Pure presentation: the caller passes an async handler returning AuthResult.
 */

import { useState, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { DEFAULT_LABELS } from "../lib";
import type { AuthResult, SignInLabels } from "../types";

/** Kept as a union of one so call sites (`methods={["google"]}`) still read as
 *  a deliberate choice, and adding a second provider stays a one-word change. */
export type AuthMethod = "google";

const ok: () => Promise<AuthResult> = async () => ({ ok: true });

export interface AuthCardProps {
  /** Methods to render. Only "google" is wired server-side today. */
  methods?: ReadonlyArray<AuthMethod>;
  title?: string;
  description?: string;
  labels?: Partial<SignInLabels>;
  footer?: ReactNode;
  className?: string;
  onGoogle?: () => Promise<AuthResult>;
  /** Fired after any successful method. */
  onSuccess?: (method: AuthMethod) => void;
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6v-3.1h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

export function AuthCard({
  methods = ["google"],
  title,
  description,
  labels: overrides,
  footer,
  className,
  onGoogle = ok,
  onSuccess,
}: AuthCardProps) {
  const labels: SignInLabels = { ...DEFAULT_LABELS, ...overrides };
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!methods.includes("google")) return null;

  const run = async () => {
    setPending(true);
    try {
      const r = await onGoogle();
      if (r.ok) {
        setError("");
        onSuccess?.("google");
      } else {
        setError(r.error || labels.genericError);
      }
    } finally {
      // Google resolves only on FAILURE (success navigates away), so clearing
      // pending here is correct — on the happy path this never runs.
      setPending(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title ?? labels.title}</CardTitle>
        <CardDescription>{description ?? labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full gap-2"
          disabled={pending}
          onClick={run}
        >
          <GoogleLogo />
          {pending ? labels.googleButtonLoading : labels.googleButton}
        </Button>
      </CardContent>

      {footer ? (
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div>
      ) : null}
    </Card>
  );
}
