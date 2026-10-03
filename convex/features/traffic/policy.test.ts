import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { allowedTrafficPath, boundedJson, parseTrafficPayload } from "./policy";
import { hasIngestAuthorization } from "./http";
import { payload, SECRET } from "./test.helpers";

beforeEach(() => vi.stubEnv("ANALYTICS_INGEST_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

test("server service auth fails closed for missing config/credential and never accepts user bearer", () => {
  const request = (authorization?: string) => new Request("https://example.test/analytics/ingest", { headers: authorization ? { authorization } : {} });
  expect(hasIngestAuthorization(request())).toBe(false);
  expect(hasIngestAuthorization(request("Bearer user-auth-token"))).toBe(false);
  expect(hasIngestAuthorization(request(`Bearer ${"b".repeat(64)}`))).toBe(false);
  expect(hasIngestAuthorization(request(`Bearer ${SECRET}`))).toBe(true);
  vi.stubEnv("ANALYTICS_INGEST_SECRET", "");
  expect(hasIngestAuthorization(request(`Bearer ${SECRET}`))).toBe(false);
});

test("only coarse public paths qualify; account/private/query/encoded paths never persist", () => {
  for (const path of ["/", "/komunitas", "/roadmap", "/mulai", "/k/belajar-ai", "/k/belajar-ai/kelas/dasar-ai", "/k/belajar-ai/materi/etika", "/k/belajar-ai/skills", "/k/belajar-ai/tentang"]) expect(allowedTrafficPath(path)).toBe(true);
  for (const path of ["/admin", "/api/analytics", "/masuk", "/pengaturan", "/u/rahman", "/sertifikat/id", "/k/belajar-ai/cari?q=email", "/k/belajar-ai/kelola", "/k/belajar-ai/kelas/dasar-ai/materi/etika", "//evil", "/?email=x", "/#secret", "/k/foo%2fadmin", "/k/../admin"]) expect(allowedTrafficPath(path)).toBe(false);
});

test("strict payload drops identity/raw properties and invalid dimensional input", () => {
  expect(parseTrafficPayload(payload())).not.toBeNull();
  for (const changes of [
    { userId: "id" }, { email: "person@example.test" }, { ip: "1.2.3.4" }, { properties: "private" },
    { sessionId: "account-token" }, { bucket: "1.2.3.4" }, { country: "Indonesia" },
    { timezone: "x".repeat(81) }, { referrerHost: "evil.test/private?q=x" },
    { utmCampaign: "person@example.test" }, { localHour: 24 }, { localHour: 1.5 },
    { browser: "full user-agent private data" }, { os: 3 }, { viewport: "huge" },
    { kind: "click" }, { kind: "cta", cta: "free-form" }, { cta: "join" },
  ]) expect(parseTrafficPayload(payload(changes))).toBeNull();
  expect(parseTrafficPayload(payload({ kind: "cta", cta: "join", browser: "Chrome", os: "Linux", language: "id-ID", timezone: "Asia/Jakarta", country: "ID", localHour: 19 }))).not.toBeNull();
});

test("body byte limit applies to streaming input, not merely content-length", async () => {
  const request = (body: string) => new Request("https://example.test", { method: "POST", body });
  expect(await boundedJson(request(JSON.stringify(payload())))).toMatchObject({ path: "/" });
  expect(await boundedJson(request("x".repeat(8193)))).toBeNull();
  expect(await boundedJson(request(JSON.stringify({ value: "😀".repeat(3000) })))).toBeNull();
  expect(await boundedJson(request("null"))).toBeNull();
  expect(await boundedJson(request("{broken"))).toBeNull();
});

test("only bounded server city labels qualify, with absent geography explicit rather than fabricated", () => {
  for (const city of ["Bandung", "São Paulo", "Xi’an", "L'Haÿ-les-Roses", "New York, N.Y.", "東京", "1 Decembrie", "Que\u0301bec"]) {
    expect(parseTrafficPayload(payload({ country: "ID", city }))?.event.city).toBe(city);
  }
  expect(parseTrafficPayload(payload({ city: "Bandung" }))?.event.country).toBeUndefined();
  expect(parseTrafficPayload(payload())?.event.city).toBeUndefined();
  for (const city of [null, 42, "", " ", "null", "NULL", "undefined", "unknown", "none", "x".repeat(101), "Jakarta\n", "Jakarta\rBandung", "Ja\u0000karta", "Ja\u202Ekarta", "<Jakarta>", "private@example.test", "...", " Jakarta"]) {
    expect(parseTrafficPayload(payload({ city }))).toBeNull();
  }
  for (const country of [null, "XX", "XXX", "ID\n", "id", "Indonesia"]) expect(parseTrafficPayload(payload({ city: "Bandung", country }))).toBeNull();
  for (const extra of [{ email: "private@example.test" }, { ip: "1.2.3.4" }, { userId: "private" }]) expect(parseTrafficPayload(payload({ city: "Bandung", country: "ID", ...extra }))).toBeNull();
});
