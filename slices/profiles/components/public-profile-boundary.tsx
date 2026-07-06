"use client";

// Error boundary for the public profile page. The anonymous queries THROW
// NOT_FOUND for an unknown handle (API contract); useQuery re-throws that during
// render, and this boundary turns it into a friendly in-slice fallback instead
// of bubbling to the app-level error page. It distinguishes NOT_FOUND (unknown
// handle) from any other error so the container can show the right copy.
//
// The container keys this boundary by `username` so navigating between profiles
// resets its error state (boundaries otherwise latch on the first error).
import { Component, type ReactNode } from "react";
import { ConvexError } from "convex/values";

export type PublicProfileBoundaryProps = {
  children: ReactNode;
  renderFallback: (info: { notFound: boolean }) => ReactNode;
};

type State = { error: unknown };

/** ConvexError typed code, or undefined for foreign errors. */
function convexErrorCode(error: unknown): string | undefined {
  if (error instanceof ConvexError) {
    return (error.data as { code?: string } | undefined)?.code;
  }
  return undefined;
}

export class PublicProfileBoundary extends Component<PublicProfileBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown) {
    // Context-prefixed, no PII (rr "logging"): only the typed code is recorded.
    console.error("[profiles:PublicProfileBoundary]", convexErrorCode(error) ?? "unknown");
  }

  render() {
    if (this.state.error !== null) {
      return this.props.renderFallback({
        notFound: convexErrorCode(this.state.error) === "NOT_FOUND",
      });
    }
    return this.props.children;
  }
}
