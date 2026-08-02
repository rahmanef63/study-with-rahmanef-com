"use client";

import { useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function AuthCallbackHandler() {
  const { signIn } = useAuthActions();
  const started = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code || started.current) return;
    started.current = true;

    void signIn("google", { code })
      .then(({ signingIn }) => {
        url.searchParams.delete("code");
        if (!signingIn) url.searchParams.set("login", "failed");
        window.history.replaceState({}, "", url);
        if (!signingIn) window.location.reload();
      })
      .catch(() => {
        url.searchParams.delete("code");
        url.searchParams.set("login", "failed");
        window.location.replace(url.toString());
      });
  }, [signIn]);

  return null;
}
