import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "../_components/page-heading";
import { KelolaConsole } from "./_components/kelola-console";

// Instructor console. Everything under it is membership-gated, so the server
// half does exactly one anonymous read — slug → tenantId — and hands off to the
// client console; the shell (rail at md+, compact bar below it) comes from the
// /k/[slug] layout.
//
// NOT a row of COMMUNITY_TABS and never was: instructor+ only. The rail
// surfaces it through <ShellAction/>, which resolves membership in the browser
// (components/shell/shell-action.tsx) — it used to be a header link, and the
// visibility rule is unchanged.
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
    // container queries (a leftover of the windowed shell). The layout's <main>
    // already declares one, so this is a NESTED container — kept because it
    // pins those views to the console's own box rather than to whatever the
    // shell's gutter happens to be, and nesting is free.
    <div className="@container">
      {/* Was an eyebrow + h2 + description; now the same <PageHeading/> every
          other page under /k uses. The eyebrow "Konsol pengelola" was a synonym
          of the title under it. The description stays: this is the one screen
          where the title really is not enough, because "Kelola" does not say
          which five things it manages. */}
      <PageHeading
        title="Kelola"
        description="Atur kelas, kuis, anggota, profil komunitas, dan pengumuman dari satu tempat."
        className="mb-6"
      />
      {/* Reading params + the tenant lookup are both dynamic under
          cacheComponents, so they live in their own boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Console params={params} />
      </Suspense>
    </div>
  );
}
