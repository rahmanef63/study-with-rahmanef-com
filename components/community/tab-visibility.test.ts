// Which tabs a community offers, and which four reach the phone bar.
//
// WHY THIS FILE IS HERE AND NOT IN lib/. The logic under test lives in
// lib/community-tabs.ts, but the shared vitest.config.mts `include` covers
// `components/**/*.test.ts` and NOT `lib/**` — a suite written next to the
// source would never run. Its two consumers are in this directory, so it is a
// reasonable home; move it to lib/community-tabs.test.ts the day `lib/**` joins
// the include list (a sibling has already filed that request).
import { describe, expect, test } from "vitest";
import {
  COMMUNITY_TABS,
  PHONE_BAR_SLOTS,
  TAB_SIGNAL_UNKNOWN,
  phoneBarTabs,
  visibleCommunityTabs,
  type TenantTabSignal,
} from "@/lib/community";

const keys = (tabs: { key: string }[]) => tabs.map((t) => t.key);

/** The real shape of every community today: nobody has an event. */
const flagship: TenantTabSignal = { hasMateri: true, hasSkills: true, hasEvents: false };
const smaller: TenantTabSignal = { hasMateri: true, hasSkills: false, hasEvents: false };

describe("visibleCommunityTabs", () => {
  test("hides Kalender when the tenant has no live session", () => {
    expect(keys(visibleCommunityTabs(flagship))).not.toContain("kalender");
    expect(keys(visibleCommunityTabs({ ...flagship, hasEvents: true }))).toContain("kalender");
  });

  test("hides Skills until the library has something published in it", () => {
    expect(keys(visibleCommunityTabs(smaller))).not.toContain("skills");
    expect(keys(visibleCommunityTabs(flagship))).toContain("skills");
  });

  test("FAILS OPEN — no signal shows every tab", () => {
    expect(keys(visibleCommunityTabs())).toEqual(keys(COMMUNITY_TABS));
    expect(keys(visibleCommunityTabs(TAB_SIGNAL_UNKNOWN))).toEqual(keys(COMMUNITY_TABS));
  });

  test("the five always-on tabs survive an all-false signal", () => {
    // A community with nothing at all still needs a home, a place to post, a
    // roster, a board and an about page. Losing any of these to an empty
    // count would remove the only route that can make it non-empty.
    const nothing: TenantTabSignal = {
      hasMateri: false,
      hasSkills: false,
      hasEvents: false,
    };
    expect(keys(visibleCommunityTabs(nothing))).toEqual([
      "kelas",
      "diskusi",
      "anggota",
      "peringkat",
      "tentang",
    ]);
  });

  test("order is always COMMUNITY_TABS order, never the filter's", () => {
    const visible = keys(visibleCommunityTabs(flagship));
    const expected = keys(COMMUNITY_TABS).filter((k) => k !== "kalender");
    expect(visible).toEqual(expected);
  });
});

describe("phoneBarTabs — the five cells", () => {
  test("splits at PHONE_BAR_SLOTS and loses nothing", () => {
    const { primary, overflow } = phoneBarTabs(flagship);
    expect(primary).toHaveLength(PHONE_BAR_SLOTS);
    expect([...keys(primary), ...keys(overflow)]).toEqual(keys(visibleCommunityTabs(flagship)));
  });

  test("flagship (has skills): Materi · Skills · Kelas · Diskusi", () => {
    expect(keys(phoneBarTabs(flagship).primary)).toEqual([
      "materi",
      "skills",
      "kelas",
      "diskusi",
    ]);
    expect(keys(phoneBarTabs(flagship).overflow)).toEqual([
      "anggota",
      "peringkat",
      "tentang",
    ]);
  });

  test("THE REVIEW NOTE: a community with no skills gets Anggota back in the bar", () => {
    // This is the whole point of splitting the VISIBLE list rather than all
    // eight tabs — an empty tab hands its slot to a real one, per community,
    // with no second list to keep in sync.
    expect(keys(phoneBarTabs(smaller).primary)).toEqual([
      "materi",
      "kelas",
      "diskusi",
      "anggota",
    ]);
  });

  test("overflow is never empty, so the Lainnya cell always has a destination", () => {
    // The sheet also carries Cari and "Komunitas lain", but the tabs alone
    // already guarantee it: five tabs can never be hidden, and only four fit.
    for (const signal of [flagship, smaller, TAB_SIGNAL_UNKNOWN]) {
      expect(phoneBarTabs(signal).overflow.length).toBeGreaterThan(0);
    }
  });
});

describe("the tab contract itself", () => {
  test("every `needs` names a real TenantTabSignal field", () => {
    const fields = new Set(Object.keys(TAB_SIGNAL_UNKNOWN));
    for (const tab of COMMUNITY_TABS) {
      if (tab.needs !== undefined) expect(fields).toContain(tab.needs);
    }
  });

  test("hiding is navigation-only — every tab still builds its href", () => {
    for (const tab of COMMUNITY_TABS) {
      expect(tab.href("belajar-ai")).toMatch(/^\/k\/belajar-ai/);
    }
  });
});
