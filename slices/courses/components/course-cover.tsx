// courses slice — a course's cover art.
//
// An owner-supplied coverImageUrl always WINS. With none, we draw procedural
// pixel cabinet art derived from the slug (lib/cover-art.ts) instead of the
// grey checkerboard that used to say "unfinished product" on the store card.
//
// A real inline <svg> — NOT a data: URI — because a data URI is its own
// document and `var(--chart-1)` inside it would never resolve against this
// page's theme. Vector shapes on a whole-pixel grid, so there is nothing to
// blur: no image-rendering hack needed and no bitmap to download.
//
// Pure and hook-free, so it renders inside the SERVER-rendered /k/[slug] grid.
import { cn } from "@/lib/utils";
import { coverArt } from "../lib/cover-art";

export type CourseCoverProps = {
  /** Course slug — the only input to the art. Same slug, same art, forever. */
  slug: string;
  /** Owner-supplied cover. Wins over the generated art when present. */
  src?: string;
  /** Sizing lives with the caller (aspect ratio differs phone vs desktop). */
  className?: string;
};

export function CourseCover({ slug, src, className }: CourseCoverProps) {
  if (src !== undefined && src !== "") {
    return (
      <div
        aria-hidden
        className={cn("bg-card bg-cover bg-center [image-rendering:pixelated]", className)}
        style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
      />
    );
  }

  const art = coverArt(slug);
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${art.width} ${art.height}`}
      // `none` on purpose: the composition must survive both the 2:1 phone card
      // and the wide, short desktop cover. Stretched whole pixels read as a CRT
      // mode; a cropped sun does not.
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <rect width={art.width} height={art.height} fill={art.base} />
      {art.layers.map((layer, i) => (
        <path key={i} d={layer.d} fill={layer.fill} fillOpacity={layer.opacity} />
      ))}
    </svg>
  );
}
