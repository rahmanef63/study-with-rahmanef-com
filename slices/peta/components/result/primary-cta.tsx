"use client";
// THE one button. A result that is only a label has failed — the point of the
// whole questionnaire is that a stranger can act today, so exactly one control
// on this screen is loud and it goes straight into the first materi of the
// top-ranked path.
//
// The first materi is resolved HERE rather than on the server, and only for
// the winning course: which course wins is known only after the answers are
// in, so pre-fetching a first lesson for all ten would be nine wasted reads on
// every page load. `getOverview` is on the anonymous etalase whitelist, so
// this works logged out, which is the case that matters.
//
// While it loads — and forever, if Convex is unreachable — the button points
// at the COURSE page. That page lists the same materi. The link is never dead,
// it just costs one extra tap.
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { communityHref } from "@/lib/community";

export type PrimaryCtaProps = {
  tenantId: Id<"tenants">;
  communitySlug: string;
  courseSlug: string;
  courseTitle: string;
};

export function PrimaryCta({ tenantId, communitySlug, courseSlug, courseTitle }: PrimaryCtaProps) {
  const overview = useQuery(api.features.courses.queries.getOverview, { tenantId, courseSlug });
  const first = overview?.lessons[0];
  const href =
    first === undefined
      ? communityHref.course(communitySlug, courseSlug)
      : communityHref.lesson(communitySlug, courseSlug, first._id);

  return (
    <Link
      href={href}
      className="flex min-h-14 w-full items-center gap-3 border border-primary bg-primary px-5 py-3 text-primary-foreground shadow-md transition-colors duration-75 [transition-timing-function:steps(2,end)] hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-display text-caption uppercase">Mulai sekarang</span>
        <span className="mt-1 block truncate text-title font-medium">
          {first === undefined ? courseTitle : first.title}
        </span>
      </span>
      <ArrowRight className="size-5 shrink-0" aria-hidden />
    </Link>
  );
}
