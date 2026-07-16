"use client";

// Container the integrator mounts at /sertifikat/<completionId> (alpha wires
// the deep-link — STATUS #24). Fetches the anonymous certificate, shows a
// skeleton while loading, renders the card when ready, and — via the shared
// slice boundary — a friendly not-found/error fallback for an unknown or
// invalid id. Signed-out visitors are fully supported (no auth, §6 etalase).
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DEFAULT_CERTIFICATE_LABELS } from "../config/certificate-labels";
import { useCertificate } from "../hooks/use-certificate";
import type { CertificateLabels } from "../types";
import { CertificateCard } from "./certificate-card";
import { PublicProfileBoundary } from "./public-profile-boundary";

export type CertificateViewProps = {
  /** The courseCompletion id from the URL — plain string; server validates. */
  completionId: string;
  /** Full shareable URL for the copy button (host-supplied; never hardcoded). */
  shareUrl?: string;
  labels?: Partial<CertificateLabels>;
  className?: string;
};

export function CertificateView({
  completionId,
  shareUrl,
  labels,
  className,
}: CertificateViewProps) {
  const copy = { ...DEFAULT_CERTIFICATE_LABELS, ...labels };
  return (
    <div className={cn("w-full", className)}>
      {/* key resets the boundary's latched error when the id changes */}
      <PublicProfileBoundary
        key={completionId}
        renderFallback={({ notFound }) => (
          <CertificateFallback copy={copy} notFound={notFound} />
        )}
      >
        <CertificateContent
          completionId={completionId}
          shareUrl={shareUrl}
          labels={labels}
        />
      </PublicProfileBoundary>
    </div>
  );
}

type ContentProps = {
  completionId: string;
  shareUrl?: string;
  labels?: Partial<CertificateLabels>;
};

function CertificateContent({ completionId, shareUrl, labels }: ContentProps) {
  const { certificate, isLoading } = useCertificate(completionId);
  if (isLoading) return <CertificateSkeleton />;
  if (!certificate) return null; // unreachable: an invalid id throws → boundary
  return <CertificateCard certificate={certificate} shareUrl={shareUrl} labels={labels} />;
}

function CertificateSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5" aria-busy="true">
      <span className="sr-only">{DEFAULT_CERTIFICATE_LABELS.loading}</span>
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-win)] border border-border bg-card px-6 py-10 @sm:px-12 @sm:py-14">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-52 max-w-full" />
        <Skeleton className="mt-4 h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-5 w-56 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-11 w-48 rounded-md" />
      </div>
    </div>
  );
}

function CertificateFallback({
  copy,
  notFound,
}: {
  copy: CertificateLabels;
  notFound: boolean;
}) {
  return (
    <Empty className="mx-auto max-w-2xl border">
      <EmptyHeader>
        <EmptyTitle className="font-serif">
          {notFound ? copy.notFoundTitle : copy.errorTitle}
        </EmptyTitle>
        <EmptyDescription className="text-pretty">
          {notFound ? copy.notFoundBody : copy.errorBody}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default CertificateView;
