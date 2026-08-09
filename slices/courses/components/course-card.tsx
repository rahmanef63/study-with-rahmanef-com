// courses slice — public etalase card (consumed by landing #5 + tenant home).
// Cover uses a background-image div (not next/image) because remote image
// domains need next.config.mjs remotePatterns — an integrator surface.
// TODO(rr): propose remotePatterns to alpha, then upgrade to next/image.
import Link from "next/link";
import { Badge } from "@/components/mockup-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseCardData } from "../types";

export type CourseCardProps = {
  course: CourseCardData;
  /** Route target — built by the consumer, e.g. `/t/${slug}/kelas/${course.slug}`. */
  href: string;
  /** Member progress (UI-UX-PRD §4). Omit for public/etalase cards. */
  progress?: { completedCount: number; totalCount: number };
  className?: string;
};

export function CourseCard({ course, href, progress, className }: CourseCardProps) {
  const pct =
    progress && progress.totalCount > 0
      ? Math.round((progress.completedCount / progress.totalCount) * 100)
      : null;
  return (
    <Link href={href} className="block focus-visible:outline-none">
      <Card
        className={
          className
            ? `h-full overflow-hidden transition-colors hover:border-primary/50 ${className}`
            : "h-full overflow-hidden transition-colors hover:border-primary/50"
        }
      >
        {/* Cover art. With no image the fallback is a pixel checkerboard drawn
            from two gradients — an owner who never sets a cover still gets
            something that belongs on the cabinet, not a muddy blur. */}
        <div
          aria-hidden
          className="h-28 w-full border-b-2 border-border bg-card bg-cover bg-center [image-rendering:pixelated]"
          style={
            course.coverImageUrl !== undefined
              ? { backgroundImage: `url(${JSON.stringify(course.coverImageUrl)})` }
              : {
                  backgroundImage:
                    "repeating-conic-gradient(color-mix(in oklab, var(--primary) 16%, transparent) 0% 25%, transparent 0% 50%)",
                  backgroundSize: "16px 16px",
                }
          }
        />
        <CardHeader>
          <CardTitle className="line-clamp-2 font-display text-xs leading-snug">
            {course.title}
          </CardTitle>
          <CardDescription className="line-clamp-3 text-pretty">
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pct !== null && progress ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-1.5 min-w-0 flex-1 overflow-hidden bg-muted"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress: ${pct}%`}
                >
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                {pct === 100 ? <Badge tone="success">Selesai ✓</Badge> : null}
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {progress.completedCount}/{progress.totalCount} lesson selesai
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
