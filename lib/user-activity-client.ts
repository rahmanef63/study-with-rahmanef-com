import { allowedUserActivityPath, validActivityTarget } from "../convex/features/userAnalytics/policy";

const SOURCE_KEY = "study:learning-entry-source";
type Source = { referrerHost?: string; utmSource?: string; utmCampaign?: string };
/** Coarse entry attribution survives sign-in within this tab for 30 minutes. */
export function learningEntrySource(search: string, referrer: string, origin: string, storage: Storage, now = Date.now()): Source {
  const params = new URLSearchParams(search);
  const label = (key: string) => {
    const value = params.get(key)?.toLowerCase();
    return value && /^[a-z0-9_-]{1,80}$/.test(value) ? value : undefined;
  };
  let referrerHost: string | undefined;
  try {
    const ref = new URL(referrer);
    if (ref.origin !== origin && /^(?=.{1,80}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(ref.hostname)) referrerHost = ref.hostname;
  } catch { /* Direct or unavailable. */ }
  const source = { referrerHost, utmSource: label("utm_source"), utmCampaign: label("utm_campaign") };
  try {
    const cached: unknown = JSON.parse(storage.getItem(SOURCE_KEY) ?? "null");
    if (cached && typeof cached === "object") {
      const row = cached as { source?: unknown; until?: unknown };
      if (typeof row.until === "number" && row.until <= now + 1_800_000 && row.source && typeof row.source === "object") {
        const result: Source = {};
        for (const key of ["referrerHost", "utmSource", "utmCampaign"] as const) {
          const value = (row.source as Source)[key];
          const pattern = key === "referrerHost" ? /^(?=.{1,80}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/ : /^[a-z0-9_-]{1,80}$/;
          if (typeof value === "string" && pattern.test(value)) result[key] = value;
        }
        const changedCampaign = (source.utmSource || source.utmCampaign)
          && (source.utmSource !== result.utmSource || source.utmCampaign !== result.utmCampaign);
        if (!changedCampaign) return row.until > now ? result : {};
      }
    }
    storage.setItem(SOURCE_KEY, JSON.stringify({ source, until: now + 1_800_000 }));
  } catch { /* Storage disabled: current coarse source still works. */ }
  return source;
}

export function learningClickTarget(href: string, origin: string): string | null {
  try {
    const url = new URL(href, origin);
    if (url.username || url.password) return null;
    const target = url.origin === origin ? url.pathname : `${url.origin}${url.pathname}`;
    if (url.origin === origin && !allowedUserActivityPath(target)) return null;
    return validActivityTarget(target) ? target : null;
  } catch { return null; }
}
