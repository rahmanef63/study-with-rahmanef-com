import { cn } from "@/lib/utils";

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Code-generated hero backdrop — a warm gradient mesh + paper grain, built
 * entirely from theme tokens (color-mix on --color-primary/accent/secondary),
 * so it adapts to light/dark + any preset and ships zero image bytes. Fully
 * fluid (percentage stops), reduced-motion safe (static). Drop behind hero
 * content as an absolutely-positioned layer.
 */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(58% 52% at 84% 14%, color-mix(in oklab, var(--color-primary) 24%, transparent), transparent 70%)",
            "radial-gradient(46% 46% at 10% 6%, color-mix(in oklab, var(--color-accent) 70%, transparent), transparent 66%)",
            "radial-gradient(72% 60% at 46% 112%, color-mix(in oklab, var(--color-secondary) 80%, transparent), transparent 72%)",
          ].join(","),
        }}
      />
      {/* hairline horizon to seat the mesh */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-border/70" />
      {/* paper grain */}
      <div
        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.07]"
        style={{ backgroundImage: NOISE, backgroundSize: "160px 160px" }}
      />
    </div>
  );
}
