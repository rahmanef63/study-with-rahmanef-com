"use client";

// Convex auth provider for Next 16 + cacheComponents:true. Auth actions use
// HTTP so signIn/signOut do not depend on an established WebSocket.

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { useState, type ReactNode } from "react";
import { AuthCallbackHandler } from "@/components/auth-callback-handler";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => {
    // Keep prerender deterministic when deployment env is missing.
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
    const client = new ConvexReactClient(url);
    const http = new ConvexHttpClient(url);
    const orig = client.action.bind(client);
    (client as unknown as { action: typeof client.action }).action = ((ref, args) => {
      const name = (ref as unknown as { _name?: string })?._name ?? String(ref);
      return typeof name === "string" && name.startsWith("auth:")
        ? http.action(ref, args)
        : orig(ref, args);
    }) as typeof client.action;
    return client;
  });

  return (
    <ConvexAuthProvider client={convex} shouldHandleCode={false}>
      <AuthCallbackHandler />
      {children}
    </ConvexAuthProvider>
  );
}
