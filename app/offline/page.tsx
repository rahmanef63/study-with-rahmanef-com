import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

// The service worker's floor: every navigation that cannot reach the network
// lands here (public/sw.js precaches this exact URL at install).
//
// Constraints this file must keep, or the offline story quietly breaks:
//  - ZERO data reads. No Convex, no safeQuery, no fetch. It has to render from
//    bytes that were already on the device.
//  - ZERO client JS of its own. There is no "Coba lagi" button that calls
//    location.reload(), because a plain <Link href="/"> re-issues the
//    navigation for free and works even if the bundle never downloads.
//  - force-static so it is a prerendered HTML file the worker can cache, not a
//    per-request render.
//  - ANY asset this page references must be in the worker's PRECACHE **and**
//    servable by its fetch handler. See the <img> at the bottom.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Offline",
  description: "Koneksi terputus. Halaman ini tampil tanpa internet.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <LogoMark className="size-16 text-primary" />

      <div className="space-y-4">
        <p className="eyebrow blink">Koneksi terputus</p>
        <h1 className="marquee-text">Game Paused</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Perangkatmu sedang tidak terhubung ke internet. Progres belajarmu aman — tersimpan di
          server dan akan muncul lagi begitu koneksi kembali.
        </p>
      </div>

      {/* Hard-framed panel, arcade cabinet style: border-2 + hard offset shadow. */}
      <div className="pixel-frame w-full border-border bg-card px-5 py-4 text-left">
        <p className="eyebrow mb-3">Coba ini</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Nyalakan data seluler atau sambungkan ke Wi-Fi.</li>
          <li>Matikan mode pesawat.</li>
          <li>Pindah ke tempat dengan sinyal lebih kuat.</li>
        </ul>
      </div>

      <Button asChild size="lg" className="min-h-11 w-full font-display text-[0.7rem]">
        <Link href="/">Coba lagi</Link>
      </Button>

      <p className="text-xs text-muted-foreground">
        <span aria-hidden="true">▸ </span>Insert coin to continue
      </p>

      {/* The one image on the one screen whose whole job is to work with no
          network. Two things had to be true before it could be added, and both
          are done in public/sw.js (VERSION bumped to v3 so installed users
          re-run install):
            1. "/ui/offline.webp" is in PRECACHE — fetched and stored at install
               time, while there still is a network.
            2. CACHEABLE() matches it. Precaching ALONE is not enough: the fetch
               handler `return`s without responding for anything outside
               CACHEABLE, so cached bytes it never consults cannot be served.
               Verified by removing that one line and clearing the HTTP cache —
               naturalWidth drops from 1200 to 0 and this page paints the
               broken-image icon. Full measurement in public/sw.js.
          Cropped and alt="" for the same reasons as app/not-found.tsx — the top
          two thirds of the source are baked-in raster text that would contradict
          this page ("Kamu sedang offline" vs the copy above) under a garbled
          wordmark. Only the clean skyline band renders. */}
      <img
        src="/ui/offline.webp"
        alt=""
        width={1200}
        height={240}
        decoding="async"
        className="pixelated pixel-frame aspect-[5/1] w-full border-border object-cover object-bottom"
      />
    </main>
  );
}
