"use client";

// Standalone provider buttons + the inline magic-link form. Each one
// renders independently above (or beside) the Password tab stack.

import { useState } from "react";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";

import { FieldEmail } from "./fields";
import type { AuthResult, SignInLabels } from "../types";

interface GoogleButtonProps {
  flow: () => Promise<AuthResult>;
  labels: SignInLabels;
  onResult: (result: AuthResult) => void | Promise<void>;
}

export function GoogleButton({ flow, labels, onResult }: GoogleButtonProps) {
  const [isPending, setIsPending] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        try {
          const r = await flow();
          await onResult(r);
        } finally {
          setIsPending(false);
        }
      }}
    >
      <GoogleLogo />
      {isPending ? labels.googleButtonLoading : labels.googleButton}
    </Button>
  );
}

function GoogleLogo() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.5l6.3 5.3C40.9 36 44 30.5 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

interface AnonymousButtonProps {
  flow: () => Promise<AuthResult>;
  labels: SignInLabels;
  onResult: (result: AuthResult) => void | Promise<void>;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

export function AnonymousButton({
  flow,
  labels,
  onResult,
  variant = "outline",
  size = "default",
}: AnonymousButtonProps) {
  const [isPending, setIsPending] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className="w-full"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        try {
          const r = await flow();
          await onResult(r);
        } finally {
          setIsPending(false);
        }
      }}
    >
      <User className="mr-2 h-4 w-4" />
      {isPending ? labels.anonymousButtonLoading : labels.anonymousButton}
    </Button>
  );
}

interface MagicLinkFormProps {
  send: (email: string) => Promise<AuthResult>;
  labels: SignInLabels;
  onResult: (result: AuthResult) => void | Promise<void>;
}

export function MagicLinkForm({ send, labels, onResult }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setIsPending(true);
        try {
          const r = await send(email);
          await onResult(r);
        } finally {
          setIsPending(false);
        }
      }}
    >
      <FieldEmail
        id="magic-link-email"
        label={labels.emailLabel}
        placeholder={labels.emailPlaceholder}
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? labels.magicLinkButtonLoading : labels.magicLinkButton}
      </Button>
      <p className="text-xs text-muted-foreground">{labels.magicLinkHint}</p>
    </form>
  );
}
