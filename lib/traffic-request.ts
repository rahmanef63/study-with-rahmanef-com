import { createHmac } from "node:crypto";
import { trafficLocationIp } from "./traffic-peer";
import type { TrafficGeo } from "./traffic-geo";
import { parseTrafficPayload } from "../convex/features/traffic/policy";

const CLIENT_FIELDS = new Set(["path", "sessionId", "kind", "cta", "referrerHost", "utmSource", "utmCampaign", "viewport", "language", "timezone", "localHour"]);
export function trafficForwardPayload(input: unknown, headers: Headers, secret: string, now = Date.now(), geo: TrafficGeo | null = null) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some(key => !CLIENT_FIELDS.has(key))) return null;
  const { browser, os } = trafficDevice(headers);
  // No raw address is forwarded or persisted. Global budget remains authoritative
  // even if a proxy fails to overwrite an incoming forwarded header.
  const address = trafficLocationIp(headers) ?? "unknown";
  const day = Math.floor(now / 86_400_000);
  const bucket = createHmac("sha256", secret).update(`${day}:${address}`).digest("hex");
  const payload = { ...raw, browser, os, ...(geo ?? {}), bucket };
  return parseTrafficPayload(payload) ? payload : null;
}

export function analyticsSiteUrl(convexUrl: string | undefined): string | null {
  try {
    const url = new URL(convexUrl ?? "");
    if (url.protocol !== "https:" || !/^[a-z0-9-]+\.convex\.cloud$/.test(url.hostname)) return null;
    return `${url.origin.replace(/\.cloud$/, ".site")}/analytics/ingest`;
  } catch { return null; }
}

/** Shared coarse UA labels; the original user-agent never persists. */
export function trafficDevice(headers: Headers) {
  const agent = headers.get("user-agent") ?? "";
  const browser = /Edg\//.test(agent) ? "Edge" : /OPR\//.test(agent) ? "Opera" : /SamsungBrowser\//.test(agent) ? "Samsung Internet" : /Firefox\//.test(agent) ? "Firefox" : /(?:Chrome|CriOS)\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : agent ? "Other" : "Unknown";
  const os = /Android/.test(agent) ? "Android" : /(?:iPhone|iPad|iPod)/.test(agent) ? "iOS" : /Windows/.test(agent) ? "Windows" : /CrOS/.test(agent) ? "ChromeOS" : /Macintosh/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : agent ? "Other" : "Unknown";
  return { browser, os };
}
