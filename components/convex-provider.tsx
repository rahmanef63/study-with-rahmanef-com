"use client";

// Convex auth provider for Next 16 + cacheComponents:true. Auth actions use
// HTTP so signIn/signOut do not depend on an established WebSocket.

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { type ReactNode } from "react";
import { AuthCallbackHandler } from "@/components/auth-callback-handler";
import { ProfileBootstrap } from "@/components/profile-bootstrap";

// Module-scope lazy singleton, NOT useState(() => …). ConvexReactClient calls
// Math.random() for its session id; inside a render that trips Cache
// Components' prerender-determinism guard ("used Math.random() inside a Client
// Component without a Suspense boundary"), which fails the build for every
// page with no other dynamic hole — /admin, /changelog, /pengaturan. Building
// it once at module scope keeps the client identical across renders (which is
// what useState was for) without doing it during one.
let client: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  if (client !== null) return client;
  // Placeholder keeps a build without the env var deterministic instead of
  // throwing; the Dockerfile now fails loudly when it is missing.
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
  const next = new ConvexReactClient(url);
  const http = new ConvexHttpClient(url);
  const orig = next.action.bind(next);
  // Auth actions go over HTTP so signIn/signOut do not wait on a WebSocket.
  (next as unknown as { action: typeof next.action }).action = ((ref, args) => {
    const name = (ref as unknown as { _name?: string })?._name ?? String(ref);
    return typeof name === "string" && name.startsWith("auth:")
      ? http.action(ref, args)
      : orig(ref, args);
  }) as typeof next.action;
  client = next;
  return next;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = getConvexClient();

  return (
    <ConvexAuthProvider client={convex} shouldHandleCode={false}>
      <AuthCallbackHandler />
      <ProfileBootstrap />
      {children}
    </ConvexAuthProvider>
  );
}
