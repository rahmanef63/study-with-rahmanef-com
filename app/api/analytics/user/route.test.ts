// @vitest-environment node
import { beforeEach, test, expect, vi } from "vitest";
const { mutation, geo, attempt, client } = vi.hoisted(() => ({ mutation: vi.fn(), geo: vi.fn(), attempt: vi.fn(), client: vi.fn() }));
vi.mock("convex/browser", () => ({ ConvexHttpClient: class { constructor(url: string, opts: unknown) { client(url, opts); } mutation = mutation; } }));
vi.mock("@/lib/traffic-geo", () => ({ trafficGeoForHeaders: geo }));
vi.mock("@/lib/traffic-attempts", () => ({ permitTrafficAttempt: attempt }));
import { POST } from "./route";
const secret = "x".repeat(32);
const token = "eyJ.test.JWTtoken12345678901234567890";
const body = { kind: "click", path: "/k/belajar-ai/materi/prompt", target: "https://claude.ai/", viewport: "desktop" };
function request(payload: unknown = body, extra: Record<string, string> = {}) {
  return new Request("http://0.0.0.0:3000/api/analytics/user", { method: "POST", headers: { host: "study-with.rahmanef.com", origin: "https://study-with.rahmanef.com", authorization: `Bearer ${token}`, "content-type": "application/json", ...extra }, body: JSON.stringify(payload) });
}
beforeEach(() => { vi.clearAllMocks(); process.env.NEXT_PUBLIC_CONVEX_URL = "https://rare-toucan-552.convex.cloud"; process.env.ANALYTICS_INGEST_SECRET = secret; attempt.mockReturnValue(true); geo.mockResolvedValue({ country: "ID", city: "Bandung" }); mutation.mockResolvedValue({ accepted: true }); });
test("proxy-shaped signed-in request forwards JWT separately from private enrichment secret and event", async () => {
  expect((await POST(request())).status).toBe(204);
  expect(client).toHaveBeenCalledWith("https://rare-toucan-552.convex.cloud", expect.objectContaining({ auth: token, logger: false }));
  expect(mutation).toHaveBeenCalledWith(expect.anything(), { serverSecret: secret, event: { ...body, browser: "Unknown", os: "Unknown", country: "ID", city: "Bandung" } });
});
test("origin, identity, privacy, scope and spoofed geo fail before backend writes", async () => {
  expect((await POST(request(body, { origin: "https://attacker.example" }))).status).toBe(403);
  expect((await POST(request(body, { authorization: "" }))).status).toBe(401);
  expect((await POST(request(body, { dnt: "1" }))).status).toBe(204);
  expect((await POST(request(body, { "sec-gpc": "1" }))).status).toBe(204);
  for (const raw of [{ ...body, country: "US" }, { ...body, userId: "victim" }, { ...body, path: "/admin" }]) expect((await POST(request(raw))).status).toBe(400);
  expect(mutation).not.toHaveBeenCalled();
});
test("instrumentation fails closed without secret and fails quietly on backend rejection", async () => {
  delete process.env.ANALYTICS_INGEST_SECRET;
  expect((await POST(request())).status).toBe(204); expect(mutation).not.toHaveBeenCalled();
  process.env.ANALYTICS_INGEST_SECRET = secret; mutation.mockRejectedValue(new Error("NOT_AUTHENTICATED"));
  expect((await POST(request())).status).toBe(204); expect(mutation).toHaveBeenCalledTimes(1);
});
