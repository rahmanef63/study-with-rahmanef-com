import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { api } from "@convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Compass } from "lucide-react";
import { safeQuery } from "@/lib/convex-server";
import { communityHref } from "@/lib/community";
import { PetaCallout } from "@/features/peta";
import { AjukanKomunitas } from "../../_components/ajukan-komunitas";

// The community directory. `/` redirects to the flagship, so almost nobody
// lands here — it stays a plain server-rendered list instead of the OS app's
// search + view-toggle + "Komunitas saya" rail, all of which needed a session
// this permanently-anonymous server page cannot have.
const TITLE = "Komunitas";
const DESCRIPTION =
  "Komunitas belajar aktif di belajar-with-rahmanef.com — gratis, terbuka, berbahasa Indonesia.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/komunitas" },
  // NO `openGraph` key — see the note in app/k/[slug]/diskusi/page.tsx.
  // Declaring one without `images` suppresses the inherited card, so this page
  // was shipping with no og:image at all; app/opengraph-image.tsx is the
  // fallback it was suppressing.
};

async function CommunityList() {
  // This route has no params/searchParams, so nothing else marks it dynamic and
  // cacheComponents tries to prerender the list at build time — where the Convex
  // client's uncached fetch is illegal. Opting in here keeps the page shell
  // static and streams only this list at request time.
 await connection();
 const tenants = await safeQuery(api.features.tenants.queries.listActive, {});

  // safeQuery returns null on a Convex outage too, not just "no rows" — same
  // decision either way: say nothing is listable rather than render a 500.
 if (tenants === null || tenants.length === 0) {
 return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-display">Belum ada komunitas aktif</EmptyTitle>
          <EmptyDescription className="text-pretty">
            Komunitas pertama sedang dikurasi. Cek lagi sebentar lagi 🌱
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

 return (
    <ul className="grid gap-3 @2xl:grid-cols-2">
      {tenants.map((tenant) => (
        <li key={tenant._id}>
          <Link
 href={communityHref.home(tenant.slug)}
 className="group flex h-full flex-col gap-1.5 border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-display text-base font-medium group-hover:text-primary">
                {tenant.name}
              </span>
              {tenant.track ? (
                <span className="bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {tenant.track}
                </span>
              ) : null}
            </span>
            <span className="line-clamp-2 text-sm text-muted-foreground">
              {tenant.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function KomunitasPage() {
 return (
    // No <main> and no gutter: app/(akun)/layout.tsx owns both. Wider than the
    // account pages — a two-column card grid, not a reading column — and it
    // keeps its own @container so the mockup-kit primitives resolve against
    // that width.
    <div className="@container mx-auto w-full max-w-3xl">
      <header className="mb-8 space-y-3">
        <span className="eyebrow">Direktori</span>
        <h1 className="font-display text-lg @sm:text-xl">Komunitas belajar</h1>
        <p className="max-w-xl text-pretty text-muted-foreground">{DESCRIPTION}</p>
        {/* The only entry point to the open-a-community flow (PRD R7). */}
        <AjukanKomunitas />
        {/* Someone browsing a directory of communities is, by definition, still
            deciding. Unconditional here (unlike the community home): this page
            has no session to read and nobody lands on it twice by accident. */}
        <PetaCallout variant="compact" className="mt-2" />
      </header>
      {/* Own boundary: the etalase read is dynamic (cacheComponents), so the
 heading above still ships in the static shell. */}
      <Suspense
 fallback={
          <div className="grid gap-3 @2xl:grid-cols-2">
            <Skeleton className="h-24 w-full " />
            <Skeleton className="h-24 w-full " />
          </div>
        }
      >
        <CommunityList />
      </Suspense>
    </div>
  );
}
