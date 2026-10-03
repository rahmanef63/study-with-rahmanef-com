import type { TrafficEvent } from "./contract";
import { CTA_NAMES } from "./constants";

const FIELDS = new Set(["path", "sessionId", "kind", "cta", "referrerHost", "utmSource", "utmCampaign", "viewport", "browser", "os", "language", "timezone", "localHour", "country", "city", "bucket"]);
const BROWSERS = new Set(["Chrome", "Firefox", "Edge", "Safari", "Opera", "Samsung Internet", "Other", "Unknown"]);
const SYSTEMS = new Set(["Android", "iOS", "Windows", "macOS", "Linux", "ChromeOS", "Other", "Unknown"]);
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const COMMUNITY_PATH = new RegExp(`^/k/${SLUG}(?:/(?:materi|skills)(?:/${SLUG})?|/kelas(?:/${SLUG})?|/tentang)?$`);

/** Defense in depth: private routes, queries, encoded slashes and identity permalinks are rejected. */
export function allowedTrafficPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 256 || /[?#%\\\s]/.test(value)) return false;
  return ["/", "/komunitas", "/roadmap", "/mulai"].includes(value) || COMMUNITY_PATH.test(value);
}

export function parseTrafficPayload(value: unknown): { event: TrafficEvent; bucket: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !FIELDS.has(key))) return null;
  if (!allowedTrafficPath(input.path) || typeof input.sessionId !== "string" || !/^[a-f0-9]{16}$/.test(input.sessionId)) return null;
  if (typeof input.bucket !== "string" || !/^[a-f0-9]{64}$/.test(input.bucket)) return null;
  if (input.kind !== "page" && input.kind !== "cta") return null;
  if (input.kind === "cta" && (typeof input.cta !== "string" || !CTA_NAMES.has(input.cta))) return null;
  if (input.kind === "page" && input.cta !== undefined) return null;
  if (!["mobile", "tablet", "desktop", "unknown"].includes(String(input.viewport))) return null;
  const optional = (name: string, pattern: RegExp) => input[name] === undefined || (typeof input[name] === "string" && pattern.test(input[name] as string));
  if (!optional("referrerHost", /^(?=.{1,80}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/) || !optional("utmSource", /^[a-z0-9_-]{1,80}$/) || !optional("utmCampaign", /^[a-z0-9_-]{1,80}$/)) return null;
  if (!optional("language", /^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{2,8}){0,2}$/) || !optional("timezone", /^[A-Za-z_+-]{1,40}(?:\/[A-Za-z_+-]{1,40}){0,2}$/) || !optional("country", /^[A-Z]{2}$/)) return null;
  if (input.country !== undefined && (input.country === "XX" || (input.country as string).length !== 2)) return null;
  if (input.city !== undefined && !validTrafficCity(input.city)) return null;
  if ((input.browser !== undefined && !BROWSERS.has(String(input.browser))) || (input.os !== undefined && !SYSTEMS.has(String(input.os)))) return null;
  if (input.localHour !== undefined && (typeof input.localHour !== "number" || !Number.isInteger(input.localHour) || input.localHour < 0 || input.localHour > 23)) return null;
  const { bucket, ...event } = input;
  return { event: event as TrafficEvent, bucket: bucket as string };
}

/** City labels originate only from the authenticated server's local geolocation lookup. */
export function validTrafficCity(value: unknown): value is string {
  return typeof value === "string" && value.length >= 1 && value.length <= 100 && value === value.trim()
    && /[\p{L}\p{N}]/u.test(value) && /^[\p{L}\p{M}\p{N} .,'’-]+$/u.test(value)
    && !/[\p{C}]/u.test(value) && !/^(?:null|undefined|unknown|none)$/i.test(value);
}

/** Bounded stream reader; a dishonest Content-Length cannot allocate an unbounded body. */
export async function boundedJson(request: Request, maxBytes = 8192): Promise<unknown> {
  if (!request.body || Number(request.headers.get("content-length")) > maxBytes) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return null; }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch { return null; }
  finally { reader.releaseLock(); }
}
