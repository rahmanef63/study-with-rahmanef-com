import { Skeleton } from "@/components/ui/skeleton";

// THE MISSING SKELETON — "harusnya itu skeleton".
//
// There was no loading.tsx anywhere in this app, so between the tap and the
// first byte of the RSC payload the router had nothing to fall back to and the
// OLD page just sat there, un-acknowledged. Measured on the shipped build:
// 318 / 202 / 215 / 425 / 88 / 81ms warm, and 476ms on a throttled phone. Every
// page's own <Suspense> fallbacks only start once that window CLOSES, which is
// why "the skeletons exist and they do paint" and "nothing happens when I tap"
// were both true at the same time.
//
// One boundary here covers every route under /k/<slug>, including the ones with
// no Suspense of their own (the lesson player, /cari, the block editor). The
// shell is NOT inside it: the rail, the compact bar and the <h1> live in the
// layout, so they stay put and only the content pane swaps — which is the whole
// point of a dashboard, and what makes this read as a section loading rather
// than as the app opening again.
export default function Loading() {
  return (
    // Deliberately generic. A per-route skeleton that guesses wrong (a course
    // grid in front of a discussion feed) is a worse lie than an honest block:
    // one heading and three panels is the shape almost every surface here
    // starts with, and it is gone in well under a second.
    <div className="@container space-y-4" aria-busy="true">
      <span className="sr-only">Memuat…</span>
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2 @lg:grid-cols-3 @lg:gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="hidden h-40 @xs:block" />
        <Skeleton className="hidden h-40 @lg:block" />
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
