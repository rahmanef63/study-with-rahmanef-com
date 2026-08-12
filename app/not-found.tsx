import Link from "next/link";
import { Button } from "@/components/ui/button";

// WHY THIS IMAGE IS CROPPED IN CSS INSTEAD OF RENDERED WHOLE
//
// `public/ui/404.webp` is a 1200x800 COMPOSITION, not an illustration. Measured
// on the actual file: the top two thirds carry baked-in raster text — "404",
// "Halaman tidak ditemukan", "Kembali ke beranda dan lanjut belajar" — over a
// clipped, double-exposed "…DY WITH RAHM…" wordmark. Dropping that in whole
// would print this page's own copy a second time as unselectable,
// untranslatable, unsearchable pixels, under a garbled logo, in a purple that
// is not in the palette.
//
// The usable art is the pixel-art skyline underneath it. The last row holding
// text pixels is y=524; from y=540 down, the brightest channel in the whole
// band is 81 — pure skyline, no type. `object-bottom` on a 1200x800 source
// inside a 5:1 box shows the bottom 30% (rows 560-800), which is inside that
// clean band with 20px to spare.
//
// It also answers the brief's sizing constraint: a 1200x800 illustration at
// 390px eats 228px of a 640px fold and pushes the message and the way out
// below it. As a 5:1 horizon strip it is 68px at 390px wide, it sits AFTER the
// button, and the words come first at every width.
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

      <img
        src="/ui/404.webp"
        alt=""
        width={1200}
        height={240}
        decoding="async"
        className="pixelated pixel-frame mt-4 aspect-[5/1] w-full border-border object-cover object-bottom"
      />
    </div>
  );
}
