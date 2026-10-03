import type { Doc } from "../../_generated/dataModel";
import type { TrafficAnalytics } from "./contract";
import { DAY_MS, SCAN_LIMIT, dayKey } from "./constants";

type Event = Doc<"trafficEvents">;
type Budget = Doc<"trafficBudgets">;
const ranked = (values: (string | undefined)[]) => {
  const counts = new Map<string, number>();
  for (const value of values) { const key = value ?? "unknown"; counts.set(key, (counts.get(key) ?? 0) + 1); }
  const all = [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  const rows = all.slice(0, 20);
  if (all.some(row => row.key === "unknown") && !rows.some(row => row.key === "unknown")) rows.push(all.find(row => row.key === "unknown")!);
  return rows;
};

/** Counts observed, first-party events; browser metadata is coarse/self-reported, never identity. */
export function aggregateTraffic(events: Event[], budgets: Budget[], fromMs: number, days: 7 | 30, eventComplete: boolean, budgetComplete: boolean, collectionStart: number | null): TrafficAnalytics {
  const pages = events.filter(event => event.kind === "page");
  const ctas = events.filter(event => event.kind === "cta");
  const dropped = budgets.reduce((sum, row) => sum + row.dropped, 0);
  const exact = eventComplete && budgetComplete && dropped === 0;
  const count = (value: number) => ({ value, exact });
  const dailyDropped = new Map(budgets.map(row => [row.day, row.dropped]));
  const sessions = new Map<string, TrafficAnalytics["recentSessions"][number]>();
  for (const event of events) {
    const existing = sessions.get(event.sessionId);
    if (!existing) {
      sessions.set(event.sessionId, {
        id: event.sessionId.slice(-8), firstSeen: event.at, lastSeen: event.at,
        pages: event.kind === "page" ? 1 : 0, lastPath: event.path,
        referrerHost: event.referrerHost ?? null, viewport: event.viewport,
        browser: event.browser ?? null, os: event.os ?? null, country: event.country ?? null, city: event.city ?? null,
      });
    } else {
      existing.firstSeen = Math.min(existing.firstSeen, event.at);
      existing.pages += event.kind === "page" ? 1 : 0;
      if (event.at > existing.lastSeen) { existing.lastSeen = event.at; existing.lastPath = event.path; }
    }
  }
  const series = Array.from({ length: days }, (_, index) => {
    const day = dayKey(fromMs + index * DAY_MS);
    const rows = events.filter(event => dayKey(event.at) === day);
    return {
      day, pageViews: rows.filter(row => row.kind === "page").length,
      sessions: new Set(rows.map(row => row.sessionId)).size,
      ctaClicks: rows.filter(row => row.kind === "cta").length,
      complete: eventComplete && budgetComplete && !(dailyDropped.get(day) ?? 0),
    };
  });
  return {
    period: { days, from: dayKey(fromMs), to: dayKey(fromMs + (days - 1) * DAY_MS), timezone: "Asia/Jakarta" },
    collectionStart, collectionStartExact: false,
    sources: [
      { name: "trafficEvents", rowsRead: events.length, complete: eventComplete },
      { name: "trafficBudgets", rowsRead: budgets.length, complete: budgetComplete },
    ],
    summary: {
      pageViews: count(pages.length), sessions: count(sessions.size), ctaClicks: count(ctas.length),
      directViews: count(pages.filter(event => !event.referrerHost).length),
      droppedEvents: { value: dropped, exact: budgetComplete },
    },
    series,
    perLocalHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: pages.filter(page => page.localHour === hour).length })),
    topPaths: ranked(pages.map(page => page.path)), topReferrers: ranked(pages.map(page => page.referrerHost)),
    topSources: ranked(pages.map(page => page.utmSource)), topCampaigns: ranked(pages.map(page => page.utmCampaign)),
    topViewports: ranked(pages.map(page => page.viewport)), topBrowsers: ranked(pages.map(page => page.browser)),
    topOs: ranked(pages.map(page => page.os)), topLanguages: ranked(pages.map(page => page.language)),
    topTimezones: ranked(pages.map(page => page.timezone)), topCountries: ranked(pages.map(page => page.country)),
    topCities: ranked(pages.map(page => page.city ? `${page.city}${page.country ? `, ${page.country}` : ""}` : undefined)),
    topCtas: ranked(ctas.map(event => event.cta)),
    recentSessions: [...sessions.values()].sort((a, b) => b.lastSeen - a.lastSeen || a.id.localeCompare(b.id)).slice(0, 50),
    retentionDays: 30, scanLimit: SCAN_LIMIT,
  };
}
