import { expect, test, vi } from "vitest";
import { createTrafficGeoResolver, trafficGeoForHeaders } from "./traffic-geo";
import type { CityResponse } from "maxmind";

const hit = (country: string, city: string) => ({ country: { iso_code: country }, city: { names: { en: city } } }) as CityResponse;

test("local lookup returns bounded sanitized coarse projection without raw IP or extra fields", async () => {
  const get = vi.fn().mockReturnValue({ ...hit("id", " Jakarta "), location: { latitude: 123 }, traits: { ip_address: "8.8.8.8" } });
  const resolve = createTrafficGeoResolver(async () => ({ get }));
  expect(await resolve("::ffff:8.8.8.8")).toEqual({ country: "ID", city: "Jakarta" });
  expect(get).toHaveBeenCalledWith("8.8.8.8");
  get.mockReturnValue(hit("FR", "Évry-Courcouronnes"));
  expect(await resolve("1.1.1.1")).toEqual({ country: "FR", city: "Évry-Courcouronnes" });
  get.mockReturnValue(hit("US", "a".repeat(120)));
  expect((await resolve("8.8.8.8"))?.city).toHaveLength(80);
});

test("concurrent valid lookups share one pending reader and invalid/private IP does not load data", async () => {
  const load = vi.fn(async () => ({ get: () => hit("US", "New York") }));
  const resolve = createTrafficGeoResolver(load);
  expect(await resolve("127.0.0.1")).toBeNull();
  expect(load).not.toHaveBeenCalled();
  expect(await Promise.all([resolve("8.8.8.8"), resolve("1.1.1.1"), resolve("2001:4860:4860::8888")])).toEqual(Array(3).fill({ country: "US", city: "New York" }));
  expect(load).toHaveBeenCalledTimes(1);
});

test("missing/corrupt files, lookup errors and invalid location fields degrade to unknown", async () => {
  const load = vi.fn(async () => { throw new Error("Missing private data file"); });
  const missing = createTrafficGeoResolver(load);
  expect(await missing("8.8.8.8")).toBeNull();
  expect(await missing("1.1.1.1")).toBeNull();
  expect(load).toHaveBeenCalledTimes(1);
  const broken = createTrafficGeoResolver(async () => ({ get: () => { throw new Error("Corrupt MMDB"); } }));
  expect(await broken("8.8.8.8")).toBeNull();
  const empty = createTrafficGeoResolver(async () => ({ get: () => null }));
  expect(await empty("8.8.8.8")).toBeNull();
  for (const [country, city] of [["XX", "unknown"], ["USA", "<script>"], ["T1", "City\nCity"]]) {
    expect(await createTrafficGeoResolver(async () => ({ get: () => hit(country, city) }))("8.8.8.8")).toBeNull();
  }
});

test.skipIf(!process.env.ANALYTICS_GEO_CITY_DB)("actual mounted DB-IP City Lite resolves offline IPv4/IPv6 fixtures", async () => {
  for (const [ip, country] of [["8.8.8.8", "US"], ["36.86.63.182", "ID"], ["2a02:4780:59:53a2::1", "ID"]]) {
    const result = await trafficGeoForHeaders(new Headers({ "x-forwarded-for": ip }));
    expect(result?.country).toBe(country);
    expect(JSON.stringify(result)).not.toContain(ip);
  }
});
