import { isIP } from "node:net";
import ipaddr from "ipaddr.js";

/** Reviewed against Cloudflare's official IPv4/IPv6 lists on 2026-10-03.
 * These are proxy networks, never a geolocation source for the visitor.
 */
const CLOUDFLARE_CIDRS = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22", "2400:cb00::/32",
  "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
].map(cidr => ipaddr.parseCIDR(cidr));

/** Strict syntax excludes shorthand/octal/hex, ports and IPv6 zone identifiers.
 * Normalize mapped IPv4 before checking private/reserved address ranges.
 */
export function publicTrafficIp(value: string | null | undefined): string | null {
  if (!value || value.length > 64 || value.includes("%") || !isIP(value)) return null;
  try {
    const parsed = ipaddr.process(value);
    return parsed.range() === "unicast" ? parsed.toString() : null;
  } catch { return null; }
}
export function isCloudflareTrafficPeer(ip: string): boolean {
  const normalized = publicTrafficIp(ip);
  return normalized !== null && ipaddr.subnetMatch(ipaddr.process(normalized), { cloudflare: CLOUDFLARE_CIDRS }, "other") === "cloudflare";
}

/** Verified deployment contract: unexposed Next port behind Traefik, which
 * removes untrusted forwarding information and writes the observed last hop.
 * NEVER enable this adapter on a directly exposed application server.
 */
export function trafficLocationIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded || forwarded.length > 4096) return null;
  const peer = publicTrafficIp(forwarded.slice(forwarded.lastIndexOf(",") + 1).trim());
  if (!peer) return null;
  if (!isCloudflareTrafficPeer(peer)) return peer;
  // Worker addresses and synthetic/missing connecting IPs cannot establish
  // a visitor's location; never substitute the Cloudflare data-center IP.
  if (headers.has("cf-worker")) return null;
  const visitor = publicTrafficIp(headers.get("cf-connecting-ip"));
  if (visitor === "2a06:98c0:3600::103") return null;
  return visitor;
}
