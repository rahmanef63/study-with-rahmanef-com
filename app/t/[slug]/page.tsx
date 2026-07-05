// TODO(rr): assignment #5 — replace with preloadQuery(tenant by slug) +
// usePreloadedQuery view from the @/features/tenants barrel (assignment #1).
export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Komunitas: {slug}</h1>
      <p className="mt-3 text-muted-foreground">
        Halaman komunitas sedang disiapkan. Daftar kelas, resources, dan
        pengumuman akan tampil di sini.
      </p>
    </div>
  );
}
