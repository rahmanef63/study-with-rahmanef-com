import "server-only";
import { fetchQuery } from "convex/nextjs";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

// Server-side Convex reads for the public (SSR + generateMetadata + OG) pages.
//
// ANONYMOUS ONLY. This app mounts ConvexAuthProvider (@convex-dev/auth/react),
// which keeps its tokens in localStorage, and proxy.ts is a pass-through stub —
// so there is no cookie for a server component to forward. Every call here is
// unauthenticated by construction. Only queries on the ANONYMOUS ETALASE
// WHITELIST (AGENTS.md §6) may be called through it; anything member-gated has
// to stay a client `useQuery`.
//
// Never throws. Today a Convex outage is a spinner; once content is
// server-rendered an uncaught fetchQuery would turn the same outage into a 500
// on the most shareable pages in the product. `null` lets the caller fall back
// to the client view, which retries over the live socket.

/** Anonymous server-side query. Returns null on ANY failure — including a
 *  ConvexError NOT_FOUND, which is how these etalase queries report "no such
 *  row", so callers get one `null` to branch on. */
export async function safeQuery<Q extends FunctionReference<"query">>(
  ref: Q,
  args: FunctionArgs<Q>
): Promise<FunctionReturnType<Q> | null> {
  try {
    return await fetchQuery(ref, args);
  } catch {
    // Deliberately swallowed: NOT_FOUND and "Convex is down" are the same
    // decision here (render the fallback), and the message could carry
    // internals we must not log (AGENTS.md §6).
    return null;
  }
}

// Re-exported for server callers' convenience; the definitions live in
// lib/site.ts because client components need them too and this module is
// `server-only`.
export { SITE_ORIGIN, absoluteUrl } from "./site";
