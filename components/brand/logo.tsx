import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Brand mark — the same open-book-with-a-spark as before, redrawn on a 16×16
 * pixel grid for the arcade concept. Every shape is an axis-aligned run of
 * whole pixels and `shapeRendering="crispEdges"` disables antialiasing, so it
 * stays sharp at any size instead of turning into a grey smudge the way a
 * monoline SVG does when scaled down to a 16px favicon.
 *
 * Drawn in `currentColor` so it still inherits the surrounding text colour.
 */

/** One run of pixels: [x, y, width] on the 16×16 grid (height is always 1). */
const SPARK: [number, number, number][] = [
  [7, 0, 2],
  [6, 1, 4],
  [7, 2, 2],
];

const PAGE_ROWS: [number, number, number][] = [
  // top taper
  [3, 5, 4],
  [9, 5, 4],
  // body — left page, right page
  ...([6, 7, 8, 9, 10, 11] as const).flatMap(
    (y) => [[2, y, 5], [9, y, 5]] as [number, number, number][]
  ),
  // bottom taper
  [3, 12, 4],
  [9, 12, 4],
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
      <span className="font-display text-[0.7rem] uppercase leading-none tracking-wider">
        belajar<span className="text-muted-foreground">·with·rahmanef</span>
      </span>
    </span>
  );
}
