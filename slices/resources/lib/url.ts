// resources slice — client-side URL guard (UX only; the mutation re-validates,
// P0). Mirrors convex/features/resources/validate.ts assertUrl.
import { MAX_URL } from "../config/limits";

/** True when `url` is a bounded http(s) URL. */
export function isHttpUrl(url: string): boolean {
  const u = url.trim();
  return u.length <= MAX_URL && /^https?:\/\/[^\s]+$/i.test(u);
}

/** Host for display (e.g. "example.com") — falls back to the raw string. */
export function displayHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
