import type { ActivityInput } from "../convex/features/userAnalytics/contract";
import { validActivity } from "../convex/features/userAnalytics/policy";
import { trafficDevice } from "./traffic-request";
import type { TrafficGeo } from "./traffic-geo";

const CLIENT_FIELDS = new Set(["kind", "path", "target", "referrerHost", "utmSource", "utmCampaign", "viewport"]);
/** The browser cannot choose identity, timestamp, device or geography. */
export function userActivityPayload(raw: unknown, headers: Headers, geo: TrafficGeo | null): ActivityInput | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  if (Object.keys(input).some(key => !CLIENT_FIELDS.has(key))) return null;
  if (input.kind !== "page" && input.kind !== "click") return null;
  if (typeof input.path !== "string" || !["mobile", "tablet", "desktop", "unknown"].includes(String(input.viewport))) return null;
  for (const key of ["target", "referrerHost", "utmSource", "utmCampaign"]) if (input[key] !== undefined && typeof input[key] !== "string") return null;
  const event = { ...input, ...trafficDevice(headers), ...(geo ?? {}) } as ActivityInput;
  return validActivity(event) ? event : null;
}
