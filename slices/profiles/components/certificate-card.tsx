"use client";

// CertificateCard — presentational certificate document (STATUS #24). Pure
// props: no data fetching, no hardcoded copy/URLs, so it stays portable and
// unit-testable. The container (CertificateView) fetches and feeds it.
// Elegant "document" styling with theme tokens only (no hex — rr UI rules).
import { useState } from "react";
import { ART_SIZE } from "@/lib/art";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatEarnedDate } from "../lib/earned-date";
import { cn } from "@/lib/utils";
import { DEFAULT_CERTIFICATE_LABELS } from "../config/certificate-labels";
import type { Certificate, CertificateLabels } from "../types";

export type CertificateCardProps = {
  certificate: Certificate;
  /**
   * Full shareable URL the copy button writes. Omitted → the button is hidden
   * (portability: the slice never hardcodes an origin; the host passes its own
   * absolute URL when mounting /sertifikat/<completionId>).
   */
  shareUrl?: string;
  /** Host already renders the page title and primary share action. */
  hasServerHeading?: boolean;
  labels?: Partial<CertificateLabels>;
  className?: string;
};

export function CertificateCard({
  certificate,
  shareUrl,
  hasServerHeading = false,
  labels,
  className,
}: CertificateCardProps) {
  const copy = { ...DEFAULT_CERTIFICATE_LABELS, ...labels };
  const [copied, setCopied] = useState(false);
  const Heading = hasServerHeading ? "h2" : "h1";

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied permission) — best effort.
    }
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-5", className)}>
      <article
        aria-label={copy.heading}
        className="relative rounded-[var(--radius)] border border-border bg-card px-6 py-10 text-center shadow-sm @sm:px-12 @sm:py-14"
      >
        {/* Classic double-rule document frame — hairline, tokens only */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[calc(var(--radius)-0.25rem)] border border-border/70 @sm:inset-3"
        />

        {/* Medal + eyebrow */}
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- committed
              certificate seal; the card's text already names the document. */}
          <img
            src="/learning/badge/certificate.webp"
            alt=""
            width={ART_SIZE.card}
            height={ART_SIZE.card}
            decoding="async"
            className="pixelated size-14 object-contain"
          />
          <p className="eyebrow">{copy.eyebrow}</p>
          <Heading className="font-display text-base text-foreground @sm:text-lg">
            {copy.heading}
          </Heading>
        </div>

        <Separator className="mx-auto my-6 max-w-40" />

        {/* Recipient — the big serif name (the certificate's true headline) */}
        <p className="text-sm text-muted-foreground">{copy.awardedTo}</p>
        <p className="mt-2 break-words font-display text-xl leading-tight text-foreground @sm:text-2xl">
          {certificate.displayName}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">@{certificate.username}</p>

        {/* Course + community */}
        <p className="mt-7 text-sm text-muted-foreground">{copy.courseIntro}</p>
        <p className="mt-1 text-pretty font-display text-sm italic text-primary @sm:text-base">
          {certificate.courseTitle}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {copy.communityPrefix}{" "}
          <span className="font-medium text-foreground">{certificate.tenantName}</span>
        </p>

        {/* Earned date — quiet, letterpress-style closing line */}
        <p className="mt-7 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {copy.earnedPrefix} {formatEarnedDate(certificate.earnedAt)}
        </p>
      </article>

      {shareUrl && !hasServerHeading ? (
        <div aria-live="polite" className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 px-4"
            aria-label={copy.copyLabel}
            onClick={() => void onCopy()}
          >
            {copied ? copy.copiedLabel : copy.copyLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
