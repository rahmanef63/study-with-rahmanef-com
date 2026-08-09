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
import { absoluteUrl } from "@/lib/site";
import { communityHref } from "@/lib/community";
import { AjukanKomunitas } from "../_components/ajukan-komunitas";

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
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/komunitas"),
  },
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
          <EmptyTitle className="font-serif">Belum ada komunitas aktif</EmptyTitle>
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
            className="group flex h-full flex-col gap-1.5 rounded-xl border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 font-serif text-base font-medium group-hover:text-primary">
                {tenant.name}
              </span>
              {tenant.track ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
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
    // @container: the mounted slice views and the mockup-kit primitives size
    // themselves with container queries (a leftover of the windowed shell), so
    // a real route has to declare the container they resolve against.
    <main className="@container mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-8 space-y-3">
        <span className="eyebrow">Direktori</span>
        <h1 className="font-serif text-3xl @sm:text-4xl">Komunitas belajar</h1>
        <p className="max-w-xl text-pretty text-muted-foreground">{DESCRIPTION}</p>
        {/* The only entry point to the open-a-community flow (PRD R7). */}
        <AjukanKomunitas />
      </header>
      {/* Own boundary: the etalase read is dynamic (cacheComponents), so the
          heading above still ships in the static shell. */}
      <Suspense
        fallback={
          <div className="grid gap-3 @2xl:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        }
      >
        <CommunityList />
      </Suspense>
    </main>
  );
}
