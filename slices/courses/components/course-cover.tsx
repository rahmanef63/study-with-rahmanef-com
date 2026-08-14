// courses slice — a course's cover art.
//
// An owner-supplied coverImageUrl always WINS. With none, we draw procedural
// vector art derived from the slug (lib/cover-art.ts) instead of the grey
// checkerboard that used to say "unfinished product" on the store card.
//
// A real inline <svg> — NOT a data: URI — because a data URI is its own
// document and `var(--chart-1)` inside it would never resolve against this
// page's theme.
//
// Pure and hook-free, so it renders inside the SERVER-rendered /k/[slug] grid.
// That rules out useId for the gradient, so the id is derived from the slug:
// deterministic, stable across SSR and hydration, and two cards for the same
// course legitimately share one gradient.
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
        className={cn("bg-card bg-cover bg-center", className)}
        style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
      />
    );
  }

  const art = coverArt(slug);
  // Non-word characters cannot appear in a slug, but an id that collides with
  // another element's is a silently wrong gradient, so it is worth the guard.
  const gradientId = `cover-${slug.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${art.width} ${art.height}`}
      // SLICE, not stretch. This one component renders into a 36px square in
      // the switcher, a 44px square on the home screen and a 2:1 card cover,
      // and `none` would squash a circle into an ellipse at three different
      // ratios. Slicing shows the middle of the canvas instead, which is why
      // every composition keeps its identity inside x ∈ [24, 72].
      preserveAspectRatio="xMidYMid slice"
      className={cn("block", className)}
    >
      <defs>
        <linearGradient id={gradientId} gradientTransform={`rotate(${art.wash.angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={art.wash.ink} stopOpacity={0.3} />
          <stop offset="100%" stopColor={art.wash.ink} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={art.width} height={art.height} fill={art.base} />
      <rect width={art.width} height={art.height} fill={`url(#${gradientId})`} />
      {art.layers.map((layer, i) => (
        <path
          key={i}
          d={layer.d}
          fill={layer.fill ?? "none"}
          stroke={layer.stroke}
          strokeWidth={layer.width}
          // A hairline stays a hairline: this art is drawn once and scaled from
          // 36px to 400px, and without it the same 1-unit stroke renders as a
          // 0.4px ghost in the switcher and a 4px slab on a card.
          vectorEffect={layer.stroke === undefined ? undefined : "non-scaling-stroke"}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={layer.opacity}
        />
      ))}
    </svg>
  );
}
