import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { Skeleton } from "@/components/ui/skeleton";
import { KelolaConsole } from "./_components/kelola-console";

// Instructor console. Everything under it is membership-gated, so the server
// half does exactly one anonymous read — slug → tenantId — and hands off to the
// client console; the community header/tabs come from the /k/[slug] layout.
type Params = { slug: string };

export const metadata: Metadata = {
  title: "Kelola",
  // A private admin surface: nothing here should ever reach an index.
  robots: { index: false },
};

async function Console({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  // Unknown or inactive slug — same 404 the layout gives, so a mistyped URL
  // never renders an empty console.
  if (tenant === null) notFound();
  return <KelolaConsole tenantId={tenant._id} slug={tenant.slug} />;
}

export default function KelolaPage({ params }: { params: Promise<Params> }) {
  return (
    // @container: the management views mounted below size themselves with
    // container queries (a leftover of the windowed shell), so this page has to
    // declare the container they resolve against — the layout's <main> is not one.
    <div className="@container">
      <header className="mb-6 space-y-1">
        <span className="eyebrow">Konsol pengelola</span>
        <h2 className="font-display text-base">Kelola komunitas</h2>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">
          Atur kelas, kuis, anggota, profil komunitas, dan pengumuman dari satu tempat.
        </p>
      </header>
      {/* Reading params + the tenant lookup are both dynamic under
          cacheComponents, so they live in their own boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <Console params={params} />
      </Suspense>
    </div>
  );
}
