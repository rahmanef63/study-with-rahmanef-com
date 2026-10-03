import type { PlatformTrafficData, PlatformTrafficDays } from "../../slices/analytics/types";
import type { FixtureState } from "./learning-data";
const day = (offset: number) => new Date(Date.UTC(2026, 9, 3 - offset)).toISOString().slice(0, 10);
export function trafficData(days: PlatformTrafficDays, state: FixtureState): PlatformTrafficData {
  const exact = state !== "partial";
  const empty = state === "empty";
  const series = Array.from({ length: days }, (_, index) => ({ day: day(days - index - 1), pageViews: empty ? 0 : index % 5 + 3, sessions: empty ? 0 : index % 3 + 1, ctaClicks: empty ? 0 : index % 2, complete: exact }));
  const total = series.reduce((sum, row) => sum + row.pageViews, 0);
  const clicks = series.reduce((sum, row) => sum + row.ctaClicks, 0);
  const sessions = Math.min(18, series.reduce((sum, row) => sum + row.sessions, 0));
  const count = (value: number) => ({ value: empty ? 0 : value, exact });
  const rank = (key: string) => empty ? [] : [{ key, count: total }];
  return { period: { days, from: day(days - 1), to: day(0), timezone: "Asia/Jakarta" }, collectionStart: empty ? null : Date.UTC(2026, 9, 3 - days + 1), collectionStartExact: false, retentionDays: 30, scanLimit: 6000,
    sources: [{ name: "trafficEvents (fixture)", rowsRead: total + clicks, complete: exact }],
    summary: { pageViews: count(total), sessions: count(sessions), ctaClicks: count(clicks), directViews: count(Math.floor(total / 2)), droppedEvents: count(0) }, series,
    perLocalHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: empty ? 0 : hour >= 8 && hour <= 18 ? hour % 7 + 1 : 0 })),
    topPaths: empty ? [] : [{ key: "/komunitas", count: Math.floor(total / 2) }, { key: "/k/fixture/materi/contoh", count: total - Math.floor(total / 2) }], topReferrers: empty ? [] : [{ key: "example.org", count: total - Math.floor(total / 2) }, { key: "direct", count: Math.floor(total / 2) }], topSources: rank("fixture-source"), topCampaigns: rank("fixture-campaign"), topViewports: rank("mobile"), topBrowsers: rank("Firefox"), topOs: rank("Linux"), topLanguages: rank("id-ID"), topTimezones: rank("Asia/Jakarta"), topCountries: empty ? [] : [{ key: "ID", count: Math.floor(total / 2) }, { key: "unknown", count: total - Math.floor(total / 2) }], topCities: empty ? [] : [{ key: "Bandung, ID", count: Math.floor(total / 2) }, { key: "unknown", count: total - Math.floor(total / 2) }], topCtas: empty ? [] : [{ key: "fixture-join", count: clicks }],
    recentSessions: empty ? [] : Array.from({ length: 6 }, (_, index) => ({ id: `fixture-session-${index}`, firstSeen: Date.UTC(2026, 9, 3, 1, index), lastSeen: Date.UTC(2026, 9, 3, 2, index), pages: 2 + index, lastPath: index === 5 ? `/k/fixture/materi/${"nama-panjang-".repeat(10)}` : "/komunitas", referrerHost: index % 2 ? "example.org" : null, viewport: "mobile" as const, browser: "Firefox", os: "Linux", country: index % 2 ? "ID" : null, city: index % 2 ? "Bandung" : null })),
  };
}
