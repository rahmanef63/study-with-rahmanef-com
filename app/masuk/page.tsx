import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MasukCard } from "../_components/masuk-card";

// Sign-in. `?next=` carries where the visitor was headed (invite links, the
// JoinButton's loginHref, any member-gated redirect) so the OAuth callback
// lands there instead of dumping everyone on the home page.
type Search = { next?: string | string[] };

export const metadata: Metadata = {
 title: "Masuk",
 description: "Masuk dengan akun Google untuk menyimpan progres belajarmu.",
  // ?next= multiplies this page into infinite near-duplicates; none of them
  // belong in an index.
 robots: { index: false },
};

/** Same-origin path or "/". Rejects absolute URLs, protocol-relative "//host"
 * and the "/\host" variant browsers also resolve as an authority — an
 * attacker-supplied `next` must never leave the site. */
function safeNext(raw: string | string[] | undefined): string {
 const value = Array.isArray(raw) ? raw[0] : raw;
 if (!value || !value.startsWith("/")) return "/";
 if (value.startsWith("//") || value.startsWith("/\\")) return "/";
 return value;
}

async function MasukPanel({ searchParams }: { searchParams: Promise<Search> }) {
 const { next } = await searchParams;
 return <MasukCard next={safeNext(next)} />;
}

export default function MasukPage({ searchParams }: { searchParams: Promise<Search> }) {
 return (
    <main className="@container mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6 py-12 text-center">
      {/* Reading searchParams is dynamic under cacheComponents, so the await
 lives in its own boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full " />}>
        <MasukPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
