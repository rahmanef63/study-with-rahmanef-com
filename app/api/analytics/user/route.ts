import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { boundedJson } from "../../../../convex/features/traffic/policy";
import { requestPublicOrigin } from "@/lib/request-public-origin";
import { analyticsSiteUrl } from "@/lib/traffic-request";
import { userActivityPayload } from "@/lib/user-activity-request";
import { trafficGeoForHeaders } from "@/lib/traffic-geo";
import { permitTrafficAttempt } from "@/lib/traffic-attempts";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== requestPublicOrigin(request)) return new Response(null, { status: 403 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const auth = request.headers.get("authorization");
  if (!auth || !/^Bearer [A-Za-z0-9_.-]{20,8192}$/.test(auth)) return new Response(null, { status: 401 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 400 });
  const secret = process.env.ANALYTICS_INGEST_SECRET;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!secret || secret.length < 32 || secret.length > 256 || !analyticsSiteUrl(url)) return new Response(null, { status: 204 });
  if (!permitTrafficAttempt()) return new Response(null, { status: 204 });
  const raw = await boundedJson(request);
  if (!userActivityPayload(raw, request.headers, null)) return new Response(null, { status: 400 });
  const event = userActivityPayload(raw, request.headers, await trafficGeoForHeaders(request.headers));
  if (!event) return new Response(null, { status: 400 });
  // A separate client per request keeps credentials isolated. Backend auth is
  // authoritative; optional telemetry never refreshes or creates an auth session.
  const client = new ConvexHttpClient(url!, { auth: auth.slice(7), logger: false,
    fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(3000) }),
  });
  try { await client.mutation(api.features.userAnalytics.record.recordActivity, { serverSecret: secret, event }); }
  catch { /* No identity/body/error logging and no automatic retry. */ }
  return new Response(null, { status: 204 });
}
