// @vitest-environment node
import { test, expect } from "vitest";
import { analyticsSiteUrl, trafficForwardPayload } from "./traffic-request";
const secret = "x".repeat(32);
const event = { path: "/k/belajar-ai/materi/prompt", sessionId: "0123456789abcdef", kind: "page", viewport: "mobile" };
test("forwarded address uses final proxy hop and rotating digests; no address/account fields persist", () => {
  const headers = new Headers({ "x-forwarded-for": "forged, 8.8.8.8", "user-agent": "Mozilla Chrome/140.0 Android" });
  const first = trafficForwardPayload(event, headers, secret, 0)!;
  const same = trafficForwardPayload(event, new Headers({ "x-forwarded-for": "different, 8.8.8.8" }), secret, 0)!;
  const tomorrow = trafficForwardPayload(event, headers, secret, 86_400_000)!;
  expect(first.bucket).toBe(same.bucket);
  expect(first.bucket).not.toBe(tomorrow.bucket);
  expect(JSON.stringify(first)).not.toMatch(/8\.8\.8\.8|forged|userId/);
  expect(first.browser).toBe("Chrome"); expect(first.os).toBe("Android");
});
test("private properties, paths, queries and spoofed server buckets are rejected", () => {
  for (const raw of [{ ...event, userId: "private" }, { ...event, path: "/admin" }, { ...event, path: "/?q=secret" }, { ...event, bucket: "a".repeat(64) }]) expect(trafficForwardPayload(raw, new Headers(), secret)).toBeNull();
});
test("only a configured Convex cloud host can become a service ingest URL", () => {
  expect(analyticsSiteUrl("https://rare-toucan-552.convex.cloud")).toBe("https://rare-toucan-552.convex.site/analytics/ingest");
  for (const raw of [undefined, "http://rare-toucan-552.convex.cloud", "https://evil.convex.cloud.attacker.example", "https://example.com"]) expect(analyticsSiteUrl(raw)).toBeNull();
});

test("only trusted server geo projections persist; browser fields and country headers cannot supply location", () => {
  const headers = new Headers({ "x-forwarded-for": "8.8.8.8", "cf-ipcountry": "ID" });
  expect(trafficForwardPayload(event, headers, secret)?.country).toBeUndefined();
  expect(trafficForwardPayload({ ...event, country: "ID", city: "Bandung" }, headers, secret)).toBeNull();
  expect(trafficForwardPayload(event, headers, secret, 0, { country: "ID", city: "Bandung" })).toMatchObject({ country: "ID", city: "Bandung" });
});
