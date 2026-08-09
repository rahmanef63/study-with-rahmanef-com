import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { SectionHeader } from "@/components/mockup-kit";
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
    <div className="grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
      <Skeleton className="h-56" />
      <Skeleton className="hidden h-56 @sm:block" />
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
    <div className="grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
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
    <section className="@container">
      <SectionHeader eyebrow="Kelas" title="Mulai belajar di sini." />
      <p className="mb-6 max-w-2xl text-pretty text-sm text-muted-foreground">
        Semua kelas yang sudah terbit di komunitas ini — gratis, bisa dimulai kapan saja.
        Gabung dulu untuk membuka materinya.
      </p>
      <Suspense fallback={<KatalogSkeleton />}>
        <Katalog slug={slug} />
      </Suspense>
    </section>
  );
}
