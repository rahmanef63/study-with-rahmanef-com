import { describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Id } from "@convex/_generated/dataModel";
import { PlatformUsersTable } from "../components/platform-users-table";
import { PlatformUserDetail } from "../components/platform-user-detail";
import { PlatformUsersDashboard } from "../components/platform-users-dashboard";
import { mergePlatformUsersCopy } from "../config/users-copy";
import { usePlatformUsers, usePlatformUserDetail } from "../hooks/use-platform-users";
import { userLocation } from "../lib/users-format";
import type { PlatformUserData, PlatformUserDetailData } from "../types";

const mocks = vi.hoisted(() => ({ auth: { isAuthenticated: true, isLoading: false }, query: vi.fn(), paginated: vi.fn((reference: unknown, args: unknown) => { void reference; void args; return { results: [], status: "Exhausted", loadMore: vi.fn() }; }) }));
vi.mock("convex/react", () => ({ useConvexAuth: () => mocks.auth, useQuery: mocks.query, usePaginatedQuery: mocks.paginated }));
const count = (value = 0, exact = true) => ({ value, exact });
const userId = "test-user" as Id<"users">;
const user = (): PlatformUserData => ({
  userId, username: null, displayName: "Nama pengguna", email: null, avatarUrl: null, isPlatformAdmin: false, joinedAt: Date.UTC(2026, 9, 3), memberships: count(), reads: count(), lessonsCompleted: count(), badges: count(), quizAttempts: count(), lastLearningAt: null, status: "belum-belajar", latestVisit: null,
});
const detail = (): PlatformUserDetailData => ({ user: user(), communities: [], courses: [], reads: [], quizzes: [], activity: [], complete: true, activityComplete: true });
const copy = mergePlatformUsersCopy();

describe("real-user analytics presentation", () => {
  test("keeps missing profiles and historical locations unknown without inventing activity", () => {
    const html = renderToStaticMarkup(<PlatformUserDetail data={detail()} geoAttributionHref="https://db-ip.com" />);
    expect(html).not.toContain("<h1");
    expect(html).toContain("Profil belum dibuat");
    expect(html).toContain("Tidak tersedia");
    expect(html).toContain("Belum belajar");
    expect(html).toContain("Belum ada kunjungan atau klik");
    expect(html).toContain("tidak dihubungkan ke identitas akun");
    expect(html).toContain("IP Geolocation by DB-IP");
    expect(html).not.toContain("NaN");
    expect(userLocation(null, copy)).toBe("Tidak tersedia");
  });
  test("list links lead to caller-provided account routes and minimum counts remain visible", () => {
    const row = user(); row.memberships = count(21, false); row.email = "verified@example.test";
    const html = renderToStaticMarkup(<PlatformUsersTable rows={[row]} detailHref={(id) => `/admin/account/${id}`} copy={copy} />);
    expect(html).toContain('href="/admin/account/test-user"');
    expect(html).toContain("verified@example.test");
    expect(html).toContain("≥ 21");
    expect(html).toContain("akun ditampilkan");
    expect(html).toContain("Unduh akun yang ditampilkan");
    expect(html).toContain('tabindex="0"');
    expect(html).not.toContain("<h1");
  });
  test("page search never presents an empty loaded page as exhaustion and loading preserves the search", () => {
    const props = { rows: [], search: "akun berikutnya", onSearchChange: () => {}, onLoadMore: () => {}, detailHref: () => "/detail" };
    const emptyPage = renderToStaticMarkup(<PlatformUsersDashboard {...props} status="CanLoadMore" />);
    expect(emptyPage).toContain("halaman akun yang sudah dimuat");
    expect(emptyPage).toContain("Muat lebih banyak");
    expect(emptyPage).not.toContain("Seluruh akun sudah diperiksa");
    expect(emptyPage).toContain('maxLength="100"');
    const loading = renderToStaticMarkup(<PlatformUsersDashboard {...props} status="LoadingFirstPage" />);
    expect(loading).toContain('value="akun berikutnya"');
    expect(loading).toContain("Memuat pengguna");
    expect(loading).not.toContain("Tidak ada pengguna yang cocok");
  });
  test("partial course progress cannot claim an exact percentage or completed status despite old badges", () => {
    const data = detail(); data.complete = false;
    data.courses = [{ courseId: "course" as Id<"courses">, slug: "course", title: "Materi baru", communitySlug: "community", communityName: "Komunitas", total: 200, done: 80, percent: 40, isComplete: true, complete: false, badge: true }];
    const html = renderToStaticMarkup(<PlatformUserDetail data={data} geoAttributionHref="https://db-ip.com" />);
    expect(html).toContain("Sebagian sumber mencapai batas");
    expect(html).toContain("≥ 80 / ≥ 200");
    expect(html).toContain("Lencana tercatat");
    expect(html).not.toContain("40%");
    expect(html).not.toContain(">Tuntas<");
  });
  test("exhausted source budgets do not claim a normal role or that learning has not started", () => {
    const data = detail(); data.complete = false; data.user.isPlatformAdmin = null; data.user.status = "belum-diketahui";
    data.user.reads = count(0, false); data.user.lessonsCompleted = count(0, false);
    const html = renderToStaticMarkup(<PlatformUserDetail data={data} geoAttributionHref="https://db-ip.com" />);
    expect(html).toContain("Peran belum diketahui");
    expect(html).toContain("Belum diketahui");
    expect(html).not.toContain(">Belum belajar<");
    expect(html).not.toContain(">Pengguna<");
    expect(html).toContain("≥ 0");
  });
  test("clicks retain their origin, source and target without making untrusted destinations executable", () => {
    const data = detail(); data.activity = [{ at: Date.UTC(2026, 9, 3), kind: "click", path: "/k/community/kelas", target: "javascript:alert(1)", referrerHost: "example.test", utmSource: "newsletter", utmCampaign: "belajar", country: "ID", city: "Bandung", viewport: "mobile", browser: "Firefox", os: "Android" }];
    const html = renderToStaticMarkup(<PlatformUserDetail data={data} geoAttributionHref="https://db-ip.com" />);
    expect(html).toContain("Klik tautan"); expect(html).toContain("/k/community/kelas");
    expect(html).toContain("javascript:alert(1)"); expect(html).not.toContain('href="javascript:');
    expect(html).toContain("example.test"); expect(html).toContain("newsletter");
    expect(html).toContain("Bandung, ID"); expect(html).toContain("Firefox / Android");
  });
  test("both account queries skip until host authorization and Convex authentication are ready", () => {
    function Reader({ enabled }: { enabled: boolean }) { usePlatformUsers({ enabled, search: " nama " }); usePlatformUserDetail({ enabled, userId }); return null; }
    for (const [enabled, authenticated, loading] of [[false, true, false], [true, false, false], [true, true, true]] as const) {
      mocks.auth = { isAuthenticated: authenticated, isLoading: loading };
      renderToStaticMarkup(<Reader enabled={enabled} />);
      expect(mocks.query.mock.calls.at(-1)?.[1]).toBe("skip");
      expect(mocks.paginated.mock.calls.at(-1)?.[1]).toBe("skip");
    }
    mocks.auth = { isAuthenticated: true, isLoading: false };
    renderToStaticMarkup(<Reader enabled />);
    expect(mocks.query.mock.calls.at(-1)?.[1]).toEqual({ userId });
    expect(mocks.paginated.mock.calls.at(-1)?.[1]).toEqual({ search: "nama" });
  });
});
