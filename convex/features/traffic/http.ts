import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { boundedJson, parseTrafficPayload } from "./policy";

/** Service auth is independent of browser/user tokens. Missing configuration fails closed. */
export function hasIngestAuthorization(request: Request): boolean {
  const secret = process.env.ANALYTICS_INGEST_SECRET;
  if (!secret || secret.length < 32 || secret.length > 256) return false;
  const provided = request.headers.get("authorization");
  if (!provided?.startsWith("Bearer ")) return false;
  const token = provided.slice(7);
  if (token.length !== secret.length) return false;
  let different = 0;
  for (let index = 0; index < secret.length; index++) different |= secret.charCodeAt(index) ^ token.charCodeAt(index);
  return different === 0;
}

/** HTTP-only entry point; no public anonymous Convex mutation is exported. */
export const trafficIngest = httpAction(async (ctx, request) => {
  if (!hasIngestAuthorization(request)) return new Response(null, { status: 401 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const payload = parseTrafficPayload(await boundedJson(request));
  if (!payload) return new Response(null, { status: 400 });
  await ctx.runMutation(internal.features.traffic.record.record, payload);
  return new Response(null, { status: 204 });
});
