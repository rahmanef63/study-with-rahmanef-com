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
  Library,
  MessagesSquare,
  MoreHorizontal,
  Trophy,
  Users,
  Wand2,
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
  materi: Library,
  // A wand, not a Sparkles/Brain "AI" glyph: a skill is a prompt you WIELD.
  skills: Wand2,
  kelas: BookOpen,
  diskusi: MessagesSquare,
  anggota: Users,
  peringkat: Trophy,
  kalender: CalendarDays,
  tentang: Info,
};
const iconFor = (key: string) => TAB_ICONS[key] ?? Circle;

// THE SPLIT. Eight tabs (Materi joined with the materi model, DECISIONS
// #36/#37; Skills joined 2026-08-10), five comfortable slots at 320px, so FOUR
// tabs get a slot and the rest fall into "Lainnya":
// Materi · Skills · Kelas · Diskusi · Lainnya.
//
// The four are simply the first four of COMMUNITY_TABS — lib/community.ts is
// the SSOT and it already orders the strip by how often a member returns to
// each tab (its comment justifies that order). Reading the priority off the
// list instead of restating it here is what stopped this file from silently
// disagreeing with the desktop strip: Peringkat lost its slot to Materi in one
// edit, over there, and the phone bar followed with none.
//
// Anggota, Peringkat, Kalender and Tentang stay one tap away in the sheet,
// routes untouched. (Anggota lost its slot to Skills automatically, over
// there, which is exactly the property this file was rewritten to have.)
const PRIMARY_SLOTS = 4;

const PRIMARY_TABS: CommunityTab[] = COMMUNITY_TABS.slice(0, PRIMARY_SLOTS);
const OVERFLOW_TABS = COMMUNITY_TABS.slice(PRIMARY_SLOTS);

// Reading surfaces keep the full screen: the lesson player
// (/kelas/<course>/<lessonId>) and the module quiz (/kelas/<course>/kuis/<id>)
// are one-task pages with their own back link and their own bottom CTA
// ("Tandai selesai" / "Kirim jawaban"), which a fixed bar would sit on top of.
// The course OVERVIEW (/kelas/<course>) is one segment shallower and keeps the
// bar — it is a browsing page. /kelola deliberately keeps the bar too: it is
// the instructor's only way back out on a phone now that the top strip is
// desktop-only.
const READING_SURFACE = /\/kelas\/[^/]+\/[^/]+/;

/**
 * Height of the bar itself, before the safe-area inset. Shared with the spacer.
 *
 * 49px = the iOS tab bar (49pt), down from the 56px Material height this used
 * to be. Seven pixels sounds like nothing; it is seven pixels of course card,
 * on every single screen of the app, forever — and 49 still clears the 44px
 * target floor on its own, before the safe-area inset is added below.
 */
const BAR_H = "3.0625rem";

// ≥64px wide at 320px. Label is the BODY face: Press Start 2P at nav size is
// unreadable and ~2x wide. The 9px step below 360px is what keeps "Peringkat"
// whole on a 320px screen; above that it goes back to 10px.
const cellClass =
  "pixel-press relative flex flex-col items-center justify-center gap-0.5 px-0.5 text-[0.5625rem] leading-none tracking-tight min-[360px]:px-1 min-[360px]:text-[0.625rem]";

// The active cell is a lit coin slot, not a tinted label: gold text, a gold
// wash, and a hard 2px gold cap. Three signals, because the one thing a tab bar
// must never be is ambiguous about where you are.
const activeCell = "bg-primary/10 font-medium text-primary";
const idleCell = "text-muted-foreground";

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
                  className={cn(cellClass, active ? activeCell : idleCell)}
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
              className={cn(cellClass, "w-full", moreActive ? activeCell : idleCell)}
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
