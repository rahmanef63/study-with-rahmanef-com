import { notFound } from "next/navigation";
import { CourseCard } from "@/features/courses";
import { JoinButton, TenantProfileCard } from "@/features/tenants";
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
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <TenantProfileCard
        tenant={tenant}
        actions={<JoinButton tenantId={tenant._id} loginHref="/login" />}
      />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Kelas</h2>
        {courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                href={`/t/${tenant.slug}/kelas/${course.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
            <p className="font-medium">Kelas pertama sedang disiapkan 🌱</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Gabung dulu supaya kamu jadi yang pertama tahu saat kelasnya tayang.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
