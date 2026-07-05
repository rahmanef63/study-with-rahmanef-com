"use client";

// Slice-local auth flow wrapper around `@convex-dev/auth/react`. Every flow
// returns a normalised `AuthResult` so the page can render errors uniformly
// without sniffing exception shapes.
//
// Why a wrapper instead of using `signIn` directly: `signIn` rejects with a
// Convex-wrapped Error (see `extractAuthError`), and each provider has a
// different FormData shape. Centralising both makes the page code linear
// and keeps the provider-specific quirks out of the JSX.

import { useAuthActions } from "@convex-dev/auth/react";
import { extractAuthError } from "../lib";
import type {
  AuthResult,
  PasswordCredentials,
  RegisterCredentials,
} from "../types";

export function useAuthFlow() {
  const { signIn, signOut } = useAuthActions();

  const wrap = async (
    fn: () => Promise<unknown>,
  ): Promise<AuthResult> => {
    try {
      await fn();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractAuthError(err) };
    }
  };

  const signInWithPassword = (creds: PasswordCredentials) =>
    wrap(() => {
      const fd = new FormData();
      fd.set("email", creds.email);
      fd.set("password", creds.password);
      fd.set("flow", "signIn");
      return signIn("password", fd);
    });

  const signUpWithPassword = (creds: RegisterCredentials) =>
    wrap(() => {
      const fd = new FormData();
      fd.set("email", creds.email);
      fd.set("password", creds.password);
      if (creds.name) fd.set("name", creds.name);
      fd.set("flow", "signUp");
      return signIn("password", fd);
    });

  // Anonymous = one-tap guest. Each call mints a fresh user row, so two
  // tabs hitting this button never share state (no cross-visitor leak).
  const signInAnonymous = () => wrap(() => signIn("anonymous"));

  // Google = full OAuth redirect. `signIn` resolves on failure only;
  // success navigates away. Caller still gets `{ ok: true }` on the
  // pre-redirect happy path.
  const signInWithGoogle = () => wrap(() => signIn("google"));

  // Resend magic link — emails the user a one-tap callback URL.
  const sendMagicLink = (email: string) =>
    wrap(() => {
      const fd = new FormData();
      fd.set("email", email);
      return signIn("resend", fd);
    });

  return {
    signInWithPassword,
    signUpWithPassword,
    signInAnonymous,
    signInWithGoogle,
    sendMagicLink,
    signOut,
  };
}
