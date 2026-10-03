// @vitest-environment node
import { test, expect } from "vitest";
import { requestPublicOrigin } from "./request-public-origin";
import { POST } from "../app/api/analytics/route";
test("standalone internal bind URLs use only the routed canonical Host, never forwarded host", () => {
  const request = new Request("http://0.0.0.0:3000/api/analytics", { headers: { host: "study-with.rahmanef.com", "x-forwarded-host": "evil.example" } });
  expect(requestPublicOrigin(request)).toBe("https://study-with.rahmanef.com");
  for (const host of ["evil.example", "study-with.rahmanef.com.evil.example", "study-with.rahmanef.com:8080", ""]) expect(requestPublicOrigin(new Request(request.url, { headers: { host } }))).toBeNull();
  expect(requestPublicOrigin(new Request("https://evil.example/api", { headers: { host: "study-with.rahmanef.com" } }))).toBeNull();
});
test("real proxy-shaped analytics requests honor privacy while rejecting foreign origins", async () => {
  const headers = { host: "study-with.rahmanef.com", origin: "https://study-with.rahmanef.com", dnt: "1" };
  expect((await POST(new Request("http://0.0.0.0:3000/api/analytics", { method: "POST", headers }))).status).toBe(204);
  expect((await POST(new Request("http://0.0.0.0:3000/api/analytics", { method: "POST", headers: { ...headers, origin: "https://evil.example" } }))).status).toBe(403);
});
