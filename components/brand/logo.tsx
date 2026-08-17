import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand mark — an open book with a spark, drawn on a 16×16 grid. The grid came
 * from the retired "Arcade Cabinet" skin (3e64bda), but the mark outlived it on
 * its own merit: every shape is an axis-aligned run of whole pixels and
 * `shapeRendering="crispEdges"` disables antialiasing, so it stays sharp at a
 * 16px favicon instead of turning into the grey smudge a monoline SVG becomes
 * at that size. That is a rendering property, not a style era.
 *
 * Drawn in `currentColor` so it still inherits the surrounding text colour.
 */

/** One run of pixels: [x, y, width] on the 16×16 grid (height is always 1). */
const SPARK: [number, number, number][] = [
  [7, 0, 2],
  [6, 1, 4],
  [7, 2, 2],
];

// Pages stop one column short of the spine on each side, leaving background
// GUTTERS at x=6 and x=9. Without them the left page, spine and right page were
// adjacent same-colour runs (x2..x13 contiguous) and the whole book fused into
// one gold slab — invisible as a book at 16px and, worse, on a 512px launcher
// tile, where it read as a brick with a cross floating over it. On a pixel grid
// a shape is only legible if the negative space is drawn as deliberately as the
// positive space.
const PAGE_ROWS: [number, number, number][] = [
  // top taper
  [3, 5, 3],
  [10, 5, 3],
  // body — left page, gutter, spine, gutter, right page
  ...([6, 7, 8, 9, 10, 11] as const).flatMap(
    (y) => [[2, y, 4], [10, y, 4]] as [number, number, number][]
  ),
  // bottom taper
  [3, 12, 3],
  [10, 12, 3],
];

/** Spine: a solid 2px column joining the pages. */
const SPINE: [number, number, number][] = ([5, 6, 7, 8, 9, 10, 11, 12] as const).map(
  (y) => [7, y, 2] as [number, number, number]
);

export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={cn("size-6", className)}
      {...props}
    >
      {[...SPARK, ...PAGE_ROWS, ...SPINE].map(([x, y, w]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Full lockup — mark + wordmark in the cabinet face. */
export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("size-5 text-primary", markClassName)} />
      <span className="font-display text-caption uppercase leading-none tracking-wider">
        belajar<span className="text-muted-foreground">·with·rahmanef</span>
      </span>
    </span>
  );
}
