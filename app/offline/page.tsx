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
    </main>
  );
}
