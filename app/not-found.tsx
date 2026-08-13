import Link from "next/link";
import { Button } from "@/components/ui/button";

// THE SKYLINE STRIP, AND WHY IT NO LONGER NEEDS A CSS CROP
//
// This used to point at `public/ui/404.webp`, a 1200x800 COMPOSITION whose top
// two thirds carried baked-in raster text — "404", "Halaman tidak ditemukan",
// "Kembali ke beranda dan lanjut belajar" — over a clipped, double-exposed
// "…DY WITH RAHM…" wordmark, in a purple outside the palette. The only usable
// part was the pixel-art skyline underneath, so the file was rendered through
// `aspect-[5/1] object-bottom` to show just rows 560-800 and hide the type.
//
// `web/banner-skyline.webp` replaces it and is the art that hack was
// approximating: 1600x244, pure skyline, no type anywhere, 11 KB against the
// old file's 26. It is 6.56:1 against a 5:1 box, so `object-cover` trims the
// sides of a horizon that repeats — the crop is now cosmetic instead of
// load-bearing, and nothing breaks if the box changes shape.
//
// The sizing constraint is unchanged and still the reason this is a strip: a
// full illustration at 390px eats 228px of a 640px fold and pushes the message
// and the way out below it. At 5:1 it is 68px, it sits AFTER the button, and
// the words come first at every width.
//
// SHARED WITH /offline ON PURPOSE. Same file, and that page's service worker
// precaches it — one URL to keep in `public/sw.js` instead of two, and a user
// who hits a 404 while offline gets it from the cache.
//
// alt="" on purpose: the skyline carries nothing the heading does not already
// say, so naming it would just make a screen reader read decoration.
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center md:py-24">
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground">
        Alamat yang kamu buka tidak ada — mungkin sudah dipindah atau salah ketik.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke beranda</Link>
      </Button>

      {/* eslint-disable-next-line @next/next/no-img-element -- committed static
          asset; next/image would re-encode an 11 KB WebP for nothing. */}
      <img
        src="/web/banner-skyline.webp"
        alt=""
        width={1600}
        height={244}
        decoding="async"
        className="pixelated pixel-frame mt-4 aspect-[5/1] w-full border-border object-cover"
      />
    </div>
  );
}
