/** Standalone Next reconstructs Request.url using its internal bind hostname.
 * Traefik preserves Host after routing the one canonical production domain.
 * Never trust X-Forwarded-Host, arbitrary domains or directly exposed Next ports.
 */
export function requestPublicOrigin(request: Request): string | null {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const internal = ["0.0.0.0", "localhost", "127.0.0.1"].includes(url.hostname);
  if (host === "study-with.rahmanef.com" || host === "study-with.rahmanef.com:443") {
    return internal || url.hostname === "study-with.rahmanef.com" ? "https://study-with.rahmanef.com" : null;
  }
  if (url.hostname === "study-with.rahmanef.com" && !host) return "https://study-with.rahmanef.com";
  if (["localhost", "127.0.0.1"].includes(url.hostname) && (!host || host === url.host)) return url.origin;
  return null;
}
