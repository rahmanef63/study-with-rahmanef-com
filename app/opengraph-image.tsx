import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

// Site-wide fallback social card. Shares the renderer with every per-page card
// (lib/og.tsx) so the arcade look can never drift between them.
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
