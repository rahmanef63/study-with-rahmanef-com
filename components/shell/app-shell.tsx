// The dashboard frame. A SERVER component with no data of its own: it decides
// where the rail, the phone bar, the heading and the content go, and nothing
// else. The route layout that mounts it owns every read.
//
// TWO SHAPES, ONE NAV. At md and up a persistent 14/16rem rail with the content
// beside it. Below md the rail becomes a slide-over, and a four-cell DOCK sits
// on the bottom edge as the shortcut to it — the rail is the map, the dock is
// the thumb-reachable path to the places people actually go. The dock owns the
// menu trigger, so there is exactly one way to open the panel and it is not in
// the top-left corner.
//
// WHY THERE IS NO <ViewTransition> ANYWHERE NEAR THIS. It used to wrap the
// whole document in app/layout.tsx, and React ran a full-page transition for
// EVERY transition update inside that boundary — including each Suspense
// reveal. Measured on a throttled phone: one tap on a tab produced THREE
// consecutive whole-app entrances over 1.2s, one of which animated a frame that
// had not changed at all. That is the "terbuka 2 kali" the owner reported. It
// is gone; a dashboard's chrome does not travel with its content pane.
import { Skeleton } from "@/components/ui/skeleton";

/** The content gutter. 16px on a phone, 24px once the rail is beside it. */
export const SHELL_GUTTER = "mx-auto w-full max-w-5xl px-4 md:px-6";

export function AppShell({
  rail,
  topBar,
  dock,
  heading,
  children,
}: {
  /** The md+ sidebar body. Wrapped in <aside> here so its Suspense fallback
   *  inherits the same box and the frame cannot jump. */
  rail: React.ReactNode;
  /** The below-md compact bar: community name and one action. */
  topBar: React.ReactNode;
  /** The below-md bottom dock, which owns the slide-over copy of the nav and
   *  its own in-flow spacer. Omitted on shells that have no community to dock
   *  into (the account pages). */
  dock?: React.ReactNode;
  /** Server-rendered <h1>. Above <main> so the reading order is right. */
  heading?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* self-start + h-dvh is what makes `sticky` work on a grid item: a
          stretched item is already as tall as the row and has nothing to stick
          within. pl picks up the landscape notch inset. */}
      <aside className="sticky top-0 hidden h-dvh flex-col self-start overflow-hidden border-r bg-sidebar pt-[var(--safe-t)] pl-[var(--safe-l)] md:flex">
        {rail}
      </aside>
      <div className="flex min-w-0 flex-col pl-[var(--safe-l)] pr-[var(--safe-r)] md:pl-0">
        {topBar}
        {heading}
        {/* @container is NOT decoration: every reused slice view and every
            mockup-kit primitive sizes itself with container queries (a leftover
            of the windowed shell). A route that does not declare one leaves all
            of them stuck on their narrowest variant. */}
        <main
          className={`@container ${SHELL_GUTTER} flex-1 py-5 pb-[calc(var(--safe-b)+1.5rem)] md:py-8`}
        >
          {children}
        </main>
        {dock}
      </div>
    </div>
  );
}

/** Rail-shaped blank while the community read is in flight. Deliberately NOT a
 *  list of rows: a nav painted unfiltered and then narrowed by the tab signal
 *  is a flicker on the first paint of every page; a blank of the right shape is
 *  not. Same argument the retired tab strip's fallback made. */
export function ShellRailSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col gap-3 px-4 pt-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
