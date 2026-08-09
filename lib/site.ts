// Site constants safe for BOTH server and client bundles (lib/convex-server.ts
// is `server-only`, so absolute-URL helpers can't live there — share buttons
// are client components).

/** Canonical origin. Shared links and OG URLs must be absolute; a relative
 *  href is useless once it is pasted into WhatsApp. */
export const SITE_ORIGIN = "https://study-with.rahmanef.com";

export const absoluteUrl = (path: string) => `${SITE_ORIGIN}${path}`;
