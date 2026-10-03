import { describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlatformTrafficDashboard } from "../components/platform-traffic-dashboard";
import { usePlatformTraffic } from "../hooks/use-platform-traffic";
import { PlatformAnalyticsDashboard } from "../components/platform-analytics-dashboard";
import { aggregateCsv, platformDate, platformPercent } from "../lib/platform-format";
import { usePlatformAnalytics } from "../hooks/use-platform-analytics";
import type { PlatformAnalyticsData, PlatformTrafficData } from "../types";

const mocks = vi.hoisted(() => ({ auth: { isAuthenticated: true, isLoading: false }, query: vi.fn((reference: unknown, args: unknown) => { void reference; void args; return undefined; }) }));
vi.mock("convex/react", () => ({ useConvexAuth: () => mocks.auth, useQuery: mocks.query }));
const count = (value = 0, exact = true) => ({ value, exact });
const empty = (): PlatformAnalyticsData => ({
  period: { days: 7, from: "2026-09-27", to: "2026-10-03", timezone: "Asia/Jakarta" },
  sources: [{ name: "memberships", rowsRead: 0, complete: true }],
  summary: { users: count(), communities: count(), memberships: count(), courses: count(), lessons: count(), skills: count(), quizzes: count(), activeLearners: count(), readMemberDays: count(), lessonCompletions: count(), badges: count(), quizAttempts: count(), quizPassed: count(), comments: count(), newMembers: count(), quizPassRate: null },
  inventory: { tenantStatus: { active: count(), pending: count(), suspended: count() }, courseStatus: { published: count(), draft: count(), archived: count() }, membershipRole: { owner: count(), instructor: count(), member: count() }, neverReadLessons: count() },
  series: [], communities: [], courses: [], lessons: [], quizzes: [],
});

describe("platform analytics presentation", () => {
  test("does not invent a page title, activity, visitor counts or conversion when empty", () => {
    const html = renderToStaticMarkup(<PlatformAnalyticsDashboard data={empty()} days={7} onDaysChange={() => {}} />);
    expect(html).not.toContain("<h1");
    expect(html).toContain("Belum ada aktivitas tercatat");
    expect(html).toContain("Tidak ada data yang cocok");
    expect(html).toContain("Kelulusan kuis");
    expect(html).toContain("bukan page view");
    expect(html).not.toContain("NaN");
  });
  test("shows minimum totals and a visible source-completeness warning", () => {
    const data = empty();
    data.summary.users = count(1200, false);
    data.sources[0].complete = false;
    const html = renderToStaticMarkup(<PlatformAnalyticsDashboard data={data} days={7} onDaysChange={() => {}} />);
    expect(html).toContain("≥ 1.200");
    expect(html).toContain("Sebagian sumber mencapai batas");
    expect(html).toContain('role="status"');
  });
  test("formats selected WIB dates and leaves unavailable percentages unknown", () => {
    expect(platformDate("2026-10-03")).toBe("3 Okt");
    expect(platformPercent(null)).toBe("—");
    expect(platformPercent(12.5)).toBe("12,5%");
  });
  test("aggregate CSV quotes delimiters/newlines and neutralizes formulas without corrupting numbers", () => {
    const csv = aggregateCsv([{ title: ' =HYPERLINK("x")\nnext,part', total: -4 }, { title: '@formula', total: 0 }], [
      { key: "title", label: "Nama", value: (row) => row.title },
      { key: "total", label: "Total", value: (row) => row.total },
    ]);
    expect(csv).toBe('\uFEFF"Nama","Total"\r\n"\' =HYPERLINK(""x"")\nnext,part","-4"\r\n"\'@formula","0"\r\n');
  });
  test("query is skipped until both admin authorization and Convex authentication are ready", () => {
    function Reader({ enabled }: { enabled: boolean }) { usePlatformAnalytics({ enabled, days: 30 }); return null; }
    for (const [enabled, authenticated, loading] of [[false, true, false], [true, false, false], [true, true, true]] as const) {
      mocks.auth = { isAuthenticated: authenticated, isLoading: loading };
      renderToStaticMarkup(<Reader enabled={enabled} />);
      expect(mocks.query.mock.calls.at(-1)?.[1]).toBe("skip");
    }
    mocks.auth = { isAuthenticated: true, isLoading: false };
    renderToStaticMarkup(<Reader enabled />);
    expect(mocks.query.mock.calls.at(-1)?.[1]).toEqual({ days: 30 });
  });
});

const emptyTraffic = (): PlatformTrafficData => ({
  period: { days: 7, from: "2026-09-27", to: "2026-10-03", timezone: "Asia/Jakarta" }, collectionStart: null, collectionStartExact: false,
  sources: [{ name: "trafficEvents", rowsRead: 0, complete: true }],
  summary: { pageViews: count(), sessions: count(), ctaClicks: count(), directViews: count(), droppedEvents: count() },
  series: [], perLocalHour: [], topPaths: [], topReferrers: [], topSources: [], topCampaigns: [], topViewports: [], topBrowsers: [], topOs: [], topLanguages: [], topTimezones: [], topCountries: [], topCities: [], topCtas: [], recentSessions: [], retentionDays: 30, scanLimit: 6000,
});

describe("platform traffic presentation", () => {
  test("does not invent visitors, unavailable location or a tracking start date", () => {
    const html = renderToStaticMarkup(<PlatformTrafficDashboard data={emptyTraffic()} days={7} onDaysChange={() => {}} />);
    expect(html).not.toContain("<h1");
    expect(html).toContain("Belum ada page view");
    expect(html).toContain("Sesi browser bukan jumlah orang unik");
    expect(html).toContain("Bukan GPS atau alamat pasti");
    expect(html).toContain("dataset September 2026");
    expect(html).toContain("bukan tanggal pasti pertama kali");
    expect(html).not.toContain("NaN");
  });
  test("capped aggregate and export coverage stay visible", () => {
    const data = emptyTraffic();
    data.summary.pageViews = count(6000, false);
    data.sources[0].complete = false;
    data.topCountries = [{ key: "unknown", count: 2 }];
    data.topCities = [{ key: "unknown", count: 2 }];
    data.topTimezones = [{ key: "Asia/Jakarta", count: 2 }];
    const html = renderToStaticMarkup(<PlatformTrafficDashboard data={data} days={7} onDaysChange={() => {}} />);
    expect(html).toContain("≥ 6.000");
    expect(html).toContain("Pembacaan event mencapai batas");
    expect(html).toContain("Tidak tersedia");
    expect(html).toContain("Cakupan data");
    expect(html).toContain("Sebagian");
    expect(html).not.toContain("Jakarta, ID");
    expect(html).toContain('href="https://db-ip.com"');
    expect(html).toContain("IP Geolocation by DB-IP");
  });
  test("traffic query never runs before admin and auth are both ready", () => {
    function Reader({ enabled }: { enabled: boolean }) { usePlatformTraffic({ enabled, days: 7 }); return null; }
    for (const [enabled, authenticated, loading] of [[false, true, false], [true, false, false], [true, true, true]] as const) {
      mocks.auth = { isAuthenticated: authenticated, isLoading: loading };
      renderToStaticMarkup(<Reader enabled={enabled} />);
      expect(mocks.query.mock.calls.at(-1)?.[1]).toBe("skip");
    }
    mocks.auth = { isAuthenticated: true, isLoading: false };
    renderToStaticMarkup(<Reader enabled />);
    expect(mocks.query.mock.calls.at(-1)?.[1]).toEqual({ days: 7 });
  });
});
