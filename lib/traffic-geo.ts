import { isAbsolute } from "node:path";
import { open, type CityResponse } from "maxmind";
import { validTrafficCity } from "../convex/features/traffic/policy";
import { publicTrafficIp, trafficLocationIp } from "./traffic-peer";

export type TrafficGeo = { country?: string; city?: string };
type GeoLookup = { get: (ip: string) => CityResponse | null };

/** Injectable loader tests failure/cache behavior without fake MMDB files.
 * One pending load serves every request. No polling, network lookup or logging.
 * Missing/invalid local data stays unknown until the application restarts.
 */
export function createTrafficGeoResolver(load: () => Promise<GeoLookup | null>) {
  let pending: Promise<GeoLookup | null> | undefined;
  return async (ip: string | null): Promise<TrafficGeo | null> => {
    const address = publicTrafficIp(ip);
    if (!address) return null;
    pending ??= Promise.resolve().then(load).catch(() => null);
    try {
      const hit = (await pending)?.get(address);
      if (!hit) return null;
      const rawCountry = hit.country?.iso_code?.trim().toUpperCase();
      const country = rawCountry && /^[A-Z]{2}$/.test(rawCountry) && rawCountry !== "XX" ? rawCountry : undefined;
      const rawCity = hit.city?.names?.en?.trim().slice(0, 80);
      const city = validTrafficCity(rawCity) ? rawCity : undefined;
      return country || city ? { ...(country ? { country } : {}), ...(city ? { city } : {}) } : null;
    } catch { return null; }
  };
}

const resolve = createTrafficGeoResolver(async () => {
  const path = process.env.ANALYTICS_GEO_CITY_DB;
  if (!path || !isAbsolute(path)) return null;
  return open<CityResponse>(path, { cache: { max: 1000 }, watchForUpdates: false });
});

/** Only a vetted server-side file path configures lookup. Raw address is
 * transient and never included in the returned country/city projection.
 */
export function trafficGeoForHeaders(headers: Headers): Promise<TrafficGeo | null> {
  return resolve(trafficLocationIp(headers));
}
