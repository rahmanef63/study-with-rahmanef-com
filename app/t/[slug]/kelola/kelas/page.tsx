import { notFound } from "next/navigation";
import { getPublicTenant } from "../../tenant-data";
import { ManageCoursesClient } from "./manage-courses-client";

// Instructor+ dashboard: course list + create (server-side authz lives in the
// manage queries/mutations themselves — this page is just the mount).
export default async function KelolaKelasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (tenant === null) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <ManageCoursesClient tenantId={tenant._id} slug={slug} />
    </div>
  );
}
