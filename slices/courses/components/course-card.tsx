// courses slice — public etalase card (consumed by landing #5 + tenant home).
// Cover uses a background-image div (not next/image) because remote image
// domains need next.config.mjs remotePatterns — an integrator surface.
// TODO(rr): propose remotePatterns to alpha, then upgrade to next/image.
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseCardData } from "../types";

export type CourseCardProps = {
  course: CourseCardData;
  /** Route target — built by the consumer, e.g. `/t/${slug}/kelas/${course.slug}`. */
  href: string;
  className?: string;
};

export function CourseCard({ course, href, className }: CourseCardProps) {
  return (
    <Link href={href} className="block focus-visible:outline-none">
      <Card
        className={
          className
            ? `h-full overflow-hidden transition-colors hover:border-primary/50 ${className}`
            : "h-full overflow-hidden transition-colors hover:border-primary/50"
        }
      >
        <div
          aria-hidden
          className="h-28 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted bg-cover bg-center"
          style={
            course.coverImageUrl !== undefined
              ? { backgroundImage: `url(${JSON.stringify(course.coverImageUrl)})` }
              : undefined
          }
        />
        <CardHeader>
          <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
          <CardDescription className="line-clamp-3">{course.description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
