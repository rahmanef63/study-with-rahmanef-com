// The rail's data contract. Everything here is pure, so it runs without a
// renderer — and it pins the three things that are invisible until they are
// embarrassing: a destination with no icon, an active row that lights on the
// wrong URL, and a hardcoded list quietly replacing the data-driven one.
//
// (Lives beside the source because the shared vitest `include` covers
// `components/**/*.test.ts`.)
import { describe, expect, test } from "vitest";
import { Circle } from "lucide-react";
import { COMMUNITY_TABS, visibleCommunityTabs, type TenantTabSignal } from "@/lib/community";
import { isCommunityTabActive } from "@/components/community/tab-active";
import {
  ACCOUNT_LINKS,
  ICON_KEYS,
  KOMUNITAS_LINK,
  communityToolLinks,
  iconFor,
  isPathActive,
  kelolaLink,
  profileLink,
} from "./nav-model";

const SLUG = "belajar-ai";
/** The real shape of the flagship today: skills published, no event scheduled. */
const flagship: TenantTabSignal = { hasMateri: true, hasSkills: true, hasEvents: false };

describe("icons", () => {
  test("every shipped community tab has a real icon", () => {
    for (const tab of COMMUNITY_TABS) {
      expect(iconFor(tab.key), `no icon for tab "${tab.key}"`).not.toBe(Circle);
    }
  });

  test("an unknown key falls back instead of crashing the whole rail", () => {
    expect(iconFor("tab-yang-belum-ada")).toBe(Circle);
  });

  test("declares no icon for a tab that does not exist", () => {
    const shipped = new Set(COMMUNITY_TABS.map((t) => t.key));
    expect(ICON_KEYS.filter((k) => !shipped.has(k))).toEqual([]);
  });
});

describe("destinations are data-driven, not a static list", () => {
  // The regression this guards: someone re-types the eight tabs into the shell
  // and the tab signal stops hiding anything. The rail MUST read the same SSOT
  // the retired strip did.
  test("hides Kalender for a community with no event", () => {
    const keys = visibleCommunityTabs(flagship).map((t) => t.key);
    expect(keys).not.toContain("kalender");
    expect(keys).toContain("skills");
  });

  test("Cari is a community route, never a global one", () => {
    // /cari at the root is a 404; the only search page is per-community.
    expect(communityToolLinks(SLUG)[0]?.href).toBe(`/k/${SLUG}/cari`);
  });

  test("every rail href is an absolute in-app path", () => {
    const all = [
      KOMUNITAS_LINK,
      kelolaLink(SLUG),
      profileLink("abdurrahman-fakhrul"),
      ...communityToolLinks(SLUG),
      ...ACCOUNT_LINKS,
    ];
    for (const link of all) expect(link.href).toMatch(/^\/[a-z]/);
    expect(new Set(all.map((l) => l.key)).size).toBe(all.length);
  });
});

describe("isPathActive", () => {
  test("exact rows do not light on their children", () => {
    expect(isPathActive("/notifikasi", "/notifikasi", true)).toBe(true);
    expect(isPathActive("/notifikasi", "/notifikasi/123", true)).toBe(false);
  });

  test("prefix rows light on children but never on a sibling that shares letters", () => {
    const cari = `/k/${SLUG}/cari`;
    expect(isPathActive(cari, cari)).toBe(true);
    expect(isPathActive(cari, `${cari}/lanjutan`)).toBe(true);
    expect(isPathActive(cari, `${cari}-lama`)).toBe(false);
  });
});

describe("community tabs keep using the shared matcher", () => {
  const tab = (key: string) => COMMUNITY_TABS.find((t) => t.key === key)!;

  test("Kelas is the index route and stays exact", () => {
    expect(isCommunityTabActive(tab("kelas"), SLUG, `/k/${SLUG}`)).toBe(true);
    expect(isCommunityTabActive(tab("kelas"), SLUG, `/k/${SLUG}/anggota`)).toBe(false);
  });

  test("a post permalink still lights Diskusi", () => {
    expect(isCommunityTabActive(tab("diskusi"), SLUG, `/k/${SLUG}/post/abc123`)).toBe(true);
  });
});
