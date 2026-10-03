import { boundedJson } from "../../../convex/features/traffic/policy";
import { analyticsSiteUrl, trafficForwardPayload } from "@/lib/traffic-request";
import { requestPublicOrigin } from "@/lib/request-public-origin";
import { trafficGeoForHeaders } from "@/lib/traffic-geo";
import { permitTrafficAttempt } from "@/lib/traffic-attempts";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== requestPublicOrigin(request)) return new Response(null, { status: 403 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const secret = process.env.ANALYTICS_INGEST_SECRET;
  const url = analyticsSiteUrl(process.env.NEXT_PUBLIC_CONVEX_URL);
  if (!secret || secret.length < 32 || secret.length > 256 || !url) return new Response(null, { status: 204 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 400 });
  if (!permitTrafficAttempt()) return new Response(null, { status: 204 });
  const input = await boundedJson(request);
  if (!input) return new Response(null, { status: 400 });
  const geo = await trafficGeoForHeaders(request.headers);
  const payload = trafficForwardPayload(input, request.headers, secret, Date.now(), geo);
  if (!payload) return new Response(null, { status: 400 });
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: JSON.stringify(payload), signal: AbortSignal.timeout(3000), cache: "no-store" });
  } catch { /* Optional instrumentation never prevents reading. No retry queue. */ }
  return new Response(null, { status: 204 });
}
