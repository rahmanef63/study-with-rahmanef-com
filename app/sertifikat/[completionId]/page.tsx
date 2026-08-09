import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { api } from "@convex/_generated/api";
import { CertificateView } from "@/features/profiles";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Skeleton } from "@/components/ui/skeleton";
import { absoluteUrl, safeQuery } from "@/lib/convex-server";
import { communityHref } from "@/lib/community";

// Public certificate — a REAL route, server-rendered, with its own OG card.
//
// This is the most shareable artifact the product makes ("badge di profil
// publik agar bisa kubagikan", PRD R11) and until now it only existed as a
// client-only window: a pasted link unfurled as the same generic site card and
// a crawler saw no text at all. publicGetCertificate is on the anonymous
// etalase whitelist (AGENTS.md §6) with an id-free projection, so it is safe to
// read server-side.
type Params = { completionId: string };

const certificatePath = (id: string) => `/sertifikat/${encodeURIComponent(id)}`;

// cache(): generateMetadata, the server block and the OG route all need the
// same read; fetchQuery does not dedupe per request.
const getCertificate = cache(async (completionId: string) =>
  safeQuery(api.features.profiles.public.publicGetCertificate, { completionId })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { completionId } = await params;
  const cert = await getCertificate(completionId);
  if (cert === null) {
    return { title: "Sertifikat tidak ditemukan", robots: { index: false } };
  }
  const title = `Sertifikat ${cert.displayName} — ${cert.courseTitle}`;
  const description = `${cert.displayName} menyelesaikan kelas "${cert.courseTitle}" di komunitas ${cert.tenantName}.`;
  return {
    title,
    description,
    alternates: { canonical: certificatePath(completionId) },
    openGraph: { type: "article", title, description, url: certificatePath(completionId) },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Server block: the certificate as real HTML, so a crawler and the first paint
 *  both get text. The interactive client view hydrates below it. */
async function CertificateHeading({ completionId }: { completionId: string }) {
  const cert = await getCertificate(completionId);
  if (cert === null) return null;
  const earned = new Date(cert.earnedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <header className="mb-6 space-y-2 text-center">
      <p className="eyebrow">Sertifikat penyelesaian</p>
      <h1 className="text-balance font-serif text-3xl @sm:text-4xl">{cert.courseTitle}</h1>
      <p className="text-pretty text-muted-foreground">
        Diselesaikan oleh{" "}
        <Link href={communityHref.profile(cert.username)} className="font-medium text-foreground underline-offset-4 hover:underline">
          {cert.displayName}
        </Link>{" "}
        di komunitas {cert.tenantName} · {earned}
      </p>
      <div className="flex justify-center pt-1">
        <TombolBagikan
          url={absoluteUrl(certificatePath(completionId))}
          title={`Sertifikat ${cert.displayName} — ${cert.courseTitle}`}
          text={`${cert.displayName} menyelesaikan kelas "${cert.courseTitle}"`}
        />
      </div>
    </header>
  );
}

export default async function SertifikatPage({ params }: { params: Promise<Params> }) {
  const { completionId } = await params;
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      {/* Own boundary: the awaited read is dynamic, and without one it would
          suspend to whatever ancestor boundary exists. */}
      <Suspense fallback={<Skeleton className="mb-6 h-28 w-full rounded-xl" />}>
        <CertificateHeading completionId={completionId} />
      </Suspense>
      {/* Client view owns the live/not-found states and retries over the socket
          if the server read failed. */}
      <CertificateView
        completionId={completionId}
        shareUrl={absoluteUrl(certificatePath(completionId))}
      />
    </main>
  );
}
