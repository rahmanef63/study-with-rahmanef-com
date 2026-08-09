"use client";

// The phone tab bar. Below `md` this REPLACES the horizontally-scrolling top
// strip, which fitted 4 of 6 tabs on a Pixel 7 with no affordance that the rest
// existed. Fixed to the bottom edge, icon + label, the pattern every Indonesian
// user already has muscle memory for from WhatsApp / Tokopedia / Gojek.
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Circle,
  Info,
  MessagesSquare,
  MoreHorizontal,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { COMMUNITY_TABS, type CommunityTab } from "@/lib/community";
import { cn } from "@/lib/utils";
import { buildMoreLinks, CommunityMoreDrawer } from "./community-more-drawer";
import { isCommunityTabActive } from "./tab-active";

// lib/community.ts is the SSOT and a sibling owns writes to it, so the icon and
// the mobile priority are mapped here by key rather than added as fields.
// (Reported upward: a `mobile?: "primary" | "more"` + `icon` on CommunityTab
// would let this file stop guessing.)
const TAB_ICONS: Record<string, LucideIcon> = {
  kelas: BookOpen,
  diskusi: MessagesSquare,
  anggota: Users,
  peringkat: Trophy,
  kalender: CalendarDays,
  tentang: Info,
};
const iconFor = (key: string) => TAB_ICONS[key] ?? Circle;

// THE SPLIT. Six tabs, five comfortable slots at 320px, so four tabs get a slot
// and the rest fall into "Lainnya".
//
// Why these four: they are the only tabs a member RE-visits. Kelas is the
// product, Diskusi is the reason to come back daily, Anggota + Peringkat are
// the social loop (and Peringkat is the arcade HI-SCORE — burying the score
// board in a cabinet-themed app would be perverse).
//
// Why Kalender AND Tentang are in the sheet, rather than the brief's suggested
// "Tentang primary, Kalender folded": Tentang is a read-once page — you read
// what the community is before you join and essentially never again — so it is
// the WEAKEST candidate for permanent thumb real estate, while Kalender at
// least carries live sessions. Neither earns a slot over the four above, and
// both stay one tap away in the sheet with their route untouched.
//
// Derived by key, not by index: an unknown/renamed tab lands in "Lainnya"
// instead of silently disappearing from the app.
const PRIMARY_KEYS: readonly string[] = ["kelas", "diskusi", "anggota", "peringkat"];

const PRIMARY_TABS: CommunityTab[] = PRIMARY_KEYS.map((key) =>
  COMMUNITY_TABS.find((tab) => tab.key === key)
).filter((tab): tab is CommunityTab => tab !== undefined);
const OVERFLOW_TABS = COMMUNITY_TABS.filter((tab) => !PRIMARY_KEYS.includes(tab.key));

// Reading surfaces keep the full screen: the lesson player
// (/kelas/<course>/<lessonId>) and the module quiz (/kelas/<course>/kuis/<id>)
// are one-task pages with their own back link and their own bottom CTA
// ("Tandai selesai" / "Kirim jawaban"), which a fixed bar would sit on top of.
// The course OVERVIEW (/kelas/<course>) is one segment shallower and keeps the
// bar — it is a browsing page. /kelola deliberately keeps the bar too: it is
// the instructor's only way back out on a phone now that the top strip is
// desktop-only.
const READING_SURFACE = /\/kelas\/[^/]+\/[^/]+/;

/** Height of the bar itself, before the safe-area inset. Shared with the spacer. */
const BAR_H = "3.5rem";

// 56px tall × ≥64px wide at 320px — comfortably past the 44px target floor.
// Label is the BODY face: Press Start 2P at nav size is unreadable and ~2x wide.
// The 9px step below 360px is what keeps "Peringkat" whole on a 320px screen;
// above that it goes back to 10px.
const cellClass =
  "pixel-press relative flex flex-col items-center justify-center gap-1 px-0.5 text-[0.5625rem] leading-none tracking-tight min-[360px]:px-1 min-[360px]:text-[0.625rem]";

export function CommunityBottomNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (READING_SURFACE.test(pathname)) return null;

  const isActive = (tab: CommunityTab) => isCommunityTabActive(tab, slug, pathname);
  const moreActive = OVERFLOW_TABS.some(isActive);
  const cells = PRIMARY_TABS.length + 1;

  return (
    <>
      {/* In-flow spacer so the last card can be scrolled clear of the fixed bar.
          Rendered by this component (not as padding on <main>) so it appears and
          disappears with the bar itself, including on the reading surfaces above. */}
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: `calc(${BAR_H} + env(safe-area-inset-bottom, 0px))` }}
      />
      <nav
        aria-label="Navigasi komunitas"
        // z-40: under the .scanlines CRT overlay (9999) and under the drawer
        // (z-50), over everything else. No blur, no floating pill — a hard
        // 2px edge, same as every other frame in the cabinet.
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card md:hidden"
        // Depends on the PWA agent's viewportFit: "cover"; without it env()
        // resolves to 0 and the bar simply sits flush, which is still correct.
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${cells}, minmax(0, 1fr))` }}
        >
          {PRIMARY_TABS.map((tab) => {
            const Icon = iconFor(tab.key);
            const active = isActive(tab);
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href(slug)}
                  aria-current={active ? "page" : undefined}
                  className={cn(cellClass, active ? "text-primary" : "text-muted-foreground")}
                  style={{ minHeight: BAR_H }}
                >
                  {active ? <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-primary" /> : null}
                  <Icon className="size-5" aria-hidden />
                  <span className="max-w-full truncate">{tab.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              className={cn(cellClass, "w-full", moreActive ? "text-primary" : "text-muted-foreground")}
              style={{ minHeight: BAR_H }}
            >
              {moreActive ? <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-primary" /> : null}
              <MoreHorizontal className="size-5" aria-hidden />
              <span className="max-w-full truncate">Lainnya</span>
            </button>
          </li>
        </ul>
      </nav>
      <CommunityMoreDrawer
        open={moreOpen}
        onOpenChange={setMoreOpen}
        links={buildMoreLinks(OVERFLOW_TABS, slug, iconFor, isActive)}
      />
    </>
  );
}
