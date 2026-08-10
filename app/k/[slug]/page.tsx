import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";

// Kelas — the community's default tab: its published-course grid.
//
// Server-rendered, not a reactive island. listPublished is on the anonymous
// etalase whitelist (AGENTS.md §6), so the cards — and crucially their links —
// are real HTML: this is the only crawl path from a community to its courses,
// and a client-fetched grid left it empty. A course published seconds ago
// appearing on the next navigation is an acceptable trade for that.
type Params = { slug: string };

// THE GRID. Two columns from a 320px CONTAINER (= a 360px phone; `main` spends
// 40px on gutters), which is the narrowest screen this app still calls a phone
// rather than a relic. Below that it goes single-file on purpose: at ~134px a
// column is narrower than one Press Start 2P word, so a two-up 320px grid would
// clip course titles mid-word — denser numbers, worse product.
//
// The old value was `@sm:grid-cols-2` — 384px of container, i.e. a 424px phone.
// Nothing in the Android mid-range is that wide, so every real device got the
// one-column desktop fallback. Container widths, not viewport widths, are what
// these breakpoints have always meant here; the numbers were simply wrong.
//
// @lg (512px container ≈ a 552px viewport) keeps the three-up desktop grid the
// tab has always had.
const COURSE_GRID = "grid grid-cols-1 gap-3 @xs:grid-cols-2 @lg:grid-cols-3 @lg:gap-4";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  // No `title`: a layout's title.template applies to CHILD segments, so setting
  // one here would fall through to the ROOT template ("Kelas — belajar-with-
  // rahmanef.com") instead of the community's. Omitting it uses the layout's
  // title.default, which is the community name.
  return { alternates: { canonical: communityHref.home(slug) } };
}

function KatalogSkeleton() {
  return (
    <div className={COURSE_GRID}>
      <Skeleton className="h-56" />
      <Skeleton className="hidden h-56 @xs:block" />
      <Skeleton className="hidden h-56 @lg:block" />
    </div>
  );
}

async function Katalog({ slug }: Params) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // null = unknown slug or Convex down; the layout's own read 404s the page in
  // that case, so a quiet line is enough here.
  if (tenant === null) {
    return <p className="text-sm text-muted-foreground">Daftar kelas belum bisa dimuat.</p>;
  }

  const courses =
    ((await safeQuery(api.features.courses.queries.listPublished, {
      tenantId: tenant._id,
    })) as CourseCardData[] | null) ?? [];

  if (courses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada kelas yang terbit di komunitas ini.
      </p>
    );
  }

  return (
    <div className={COURSE_GRID}>
      {courses.map((course) => (
        <CourseCard
          key={course._id}
          course={course}
          href={communityHref.course(slug, course.slug)}
        />
      ))}
    </div>
  );
}

export default async function KelasTabPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return (
    // @container: the reused slice views size to their CONTAINER, never the
    // viewport, so the grid needs a container context to break out of 1 column.
    //
    // NOTHING above the grid. What used to live here — eyebrow "Kelas", title
    // "Mulai belajar di sini.", and a three-line paragraph — cost 190px on a
    // 390px phone, a whole course card's worth, and every word of it was
    // already on screen: the tab bar says Kelas, the header says the community
    // name and "N anggota · M kelas", and the join CTA is the header's primary
    // button. A labelled grid of course covers does not need a label. The one
    // fact that was NOT redundant ("gratis, gabung dulu untuk membuka
    // materinya") belongs on the course page where a learner hits the wall, not
    // as a pre-emptive apology in front of the catalogue.
    <section className="@container">
      <Suspense fallback={<KatalogSkeleton />}>
        <Katalog slug={slug} />
      </Suspense>
    </section>
  );
}
