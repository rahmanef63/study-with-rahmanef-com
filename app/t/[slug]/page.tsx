import { notFound } from "next/navigation";
import { JoinButton, TenantProfileCard } from "@/features/tenants";
import { TenantAnnouncementsTeaser } from "./tenant-announcements-teaser";
import { TenantCourseGrid } from "./tenant-course-grid";
import { getPublicTenant, getPublishedCourses } from "./tenant-data";

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (tenant === null) notFound();
  const courses = await getPublishedCourses(tenant._id);
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10 sm:py-12">
      <TenantProfileCard
        tenant={tenant}
        actions={<JoinButton tenantId={tenant._id} loginHref={`/login?returnTo=/t/${tenant.slug}`} />}
      />
      <TenantAnnouncementsTeaser tenantId={tenant._id} slug={tenant.slug} />
      <section className="space-y-5">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Kelas</span>
          <h2 className="text-2xl sm:text-3xl">Mulai belajar di sini.</h2>
        </div>
        {courses.length > 0 ? (
          <TenantCourseGrid courses={courses} tenantId={tenant._id} slug={tenant.slug} />
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium">Kelas pertama sedang disiapkan 🌱</p>
            <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
              Gabung dulu supaya kamu jadi yang pertama tahu saat kelasnya tayang.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
