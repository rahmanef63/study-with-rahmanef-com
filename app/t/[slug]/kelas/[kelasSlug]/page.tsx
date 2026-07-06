import { notFound } from "next/navigation";
import { getPublicTenant } from "../../tenant-data";
import { CourseOverviewClient } from "./course-overview-client";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string; kelasSlug: string }>;
}) {
  const { slug, kelasSlug } = await params;
  const tenant = await getPublicTenant(slug);
  if (tenant === null) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <CourseOverviewClient
        tenantId={tenant._id}
        tenantSlug={tenant.slug}
        courseSlug={kelasSlug}
      />
    </div>
  );
}
