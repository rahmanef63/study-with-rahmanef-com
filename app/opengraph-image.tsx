import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

// Site-wide fallback social card. Shares the renderer with every per-page card
// (lib/og.tsx) so the arcade look can never drift between them.
//
// KEPT GENERATED, deliberately — the asset pack ships /social/og-default.png,
// a static 1200x630 card that could serve this exact slot, and it was measured
// against this one rather than waved off (full table: docs/ASSETS.md §4):
//   - bytes per unfurl: this card is 55,689 (it is PRERENDERED — the build
//     rasterises it once and prerender-manifest.json lists /opengraph-image, so
//     runtime cost is a static file read). og-default.png is 318,619: +263 KB
//     for the same slot.
//   - dependency: swapping would NOT drop next/og. Eight colocated routes still
//     render through ogCard per request.
//   - the PNG's copy is English and names "STUDY WITH RAHMAN", not this
//     product, and its wordmark is double-exposed (see docs/ASSETS.md §5).
// Routes with their own opengraph-image keep it either way; this is only the
// fallback for everything else.
export const alt = "belajar-with-rahmanef.com — belajar pakai AI, bareng-bareng";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return ogCard({
    eyebrow: "Insert coin · Player 1",
    title: "Belajar pakai AI, bareng-bareng.",
    subtitle: "Kelas praktis pengaplikasian AI — gratis, berbahasa Indonesia.",
  });
}
