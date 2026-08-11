// Which sections a community offers the DASHBOARD RAIL, and in what order.
//
// WHAT CHANGED 2026-08-11. This file used to have a second describe block,
// "phoneBarTabs — the five cells", pinning which four of eight destinations won
// a slot in the phone bottom bar and which fell into the "Lainnya" sheet. The
// bar, the sheet and `phoneBarTabs()` are all deleted — a rail renders every
// row at every width — so those five specs were removed rather than adapted.
// They were not evidence of anything once the thing they described was gone.
//
// What replaced them is the ORDER block below. Under the old five-cell budget
// the order was load-bearing in a way a test could see (it decided visibility);
// in a rail it decides only reading order, which is exactly the kind of
// decision that rots silently. So the list is pinned here, with the grouping
// argument, and lib/community-tabs.ts carries the reasoning.
//
// WHY THIS FILE IS HERE AND NOT IN lib/. The logic under test lives in
// lib/community-tabs.ts, but the shared vitest.config.mts `include` covers
// `components/**/*.test.ts` and NOT `lib/**` — a suite written next to the
// source would never run. Move it to lib/community-tabs.test.ts the day
// `lib/**` joins the include list (a sibling has already filed that request).
// Its only neighbour in this directory is now tab-active.ts, the active-row
// matcher the rail imports; everything else here was the retired chrome.
import { describe, expect, test } from "vitest";
import {
  COMMUNITY_TABS,
  TAB_SIGNAL_UNKNOWN,
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

  test("FAILS OPEN — no signal shows every row", () => {
    expect(keys(visibleCommunityTabs())).toEqual(keys(COMMUNITY_TABS));
    expect(keys(visibleCommunityTabs(TAB_SIGNAL_UNKNOWN))).toEqual(keys(COMMUNITY_TABS));
  });

  test("the five always-on rows survive an all-false signal", () => {
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

describe("the rail's reading order", () => {
  test("the full list, top to bottom", () => {
    // Grouped, not ranked by frequency (that was the phone bar's budget):
    // LEARN · TALK · PEOPLE · WHEN · WHAT THIS IS.
    expect(keys(COMMUNITY_TABS)).toEqual([
      "kelas",
      "materi",
      "skills",
      "diskusi",
      "anggota",
      "peringkat",
      "kalender",
      "tentang",
    ]);
  });

  test("the row you land on is the FIRST row", () => {
    // /k/<slug> IS the Kelas route. If it is not first, opening a community
    // puts the rail's active cursor in the middle of a list you did not choose
    // from — which is what it did while the order served the five-cell bar.
    const first = COMMUNITY_TABS[0];
    expect(first?.key).toBe("kelas");
    expect(first?.href("belajar-ai")).toBe("/k/belajar-ai");
    expect(first?.exact).toBe(true);
  });

  test("the two library rows stay adjacent — they are one table", () => {
    // A skill is a materi with `kind: "skill"`. Splitting them puts a talk
    // surface between two halves of the same content model.
    const all = keys(COMMUNITY_TABS);
    expect(all.indexOf("skills")).toBe(all.indexOf("materi") + 1);
  });

  test("Peringkat can only follow Anggota — it is a projection of the roster", () => {
    const all = keys(COMMUNITY_TABS);
    expect(all.indexOf("peringkat")).toBe(all.indexOf("anggota") + 1);
  });

  test("Tentang is last — read once, before joining", () => {
    expect(COMMUNITY_TABS.at(-1)?.key).toBe("tentang");
  });
});

describe("the row contract itself", () => {
  test("every `needs` names a real TenantTabSignal field", () => {
    const fields = new Set(Object.keys(TAB_SIGNAL_UNKNOWN));
    for (const tab of COMMUNITY_TABS) {
      if (tab.needs !== undefined) expect(fields).toContain(tab.needs);
    }
  });

  test("hiding is navigation-only — every row still builds its href", () => {
    for (const tab of COMMUNITY_TABS) {
      expect(tab.href("belajar-ai")).toMatch(/^\/k\/belajar-ai/);
    }
  });

  test("no duplicate keys, no duplicate destinations", () => {
    // A rail renders all eight at once, so a duplicate is visible rather than
    // hidden behind a "Lainnya" sheet the way it could have been before.
    expect(new Set(keys(COMMUNITY_TABS)).size).toBe(COMMUNITY_TABS.length);
    const hrefs = COMMUNITY_TABS.map((t) => t.href("belajar-ai"));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
