"use client";

// Slice-local auth flow wrapper around `@convex-dev/auth/react`. Returns a
// normalised `AuthResult` so callers render errors uniformly without sniffing
// exception shapes (`signIn` rejects with a Convex-wrapped Error — see
// `extractAuthError`).
//
// Google-only: the password / magic-link / anonymous flows were removed because
// convex/auth.ts registers ONLY Google, so calling them threw at runtime.

import { useAuthActions } from "@convex-dev/auth/react";
import { extractAuthError } from "../lib";
import type { AuthResult } from "../types";

export function useAuthFlow() {
  const { signIn, signOut } = useAuthActions();

  const wrap = async (fn: () => Promise<unknown>): Promise<AuthResult> => {
    try {
      await fn();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractAuthError(err) };
    }
  };

  // Google = full OAuth redirect. `signIn` resolves on failure only; success
  // navigates away. `redirectTo` is where the user lands after the callback.
  const signInWithGoogle = (redirectTo?: string) =>
    wrap(() => signIn("google", redirectTo ? { redirectTo } : undefined));

  return { signInWithGoogle, signOut };
}
