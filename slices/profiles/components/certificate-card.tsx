"use client";

// CertificateCard — presentational certificate document (STATUS #24). Pure
// props: no data fetching, no hardcoded copy/URLs, so it stays portable and
// unit-testable. The container (CertificateView) fetches and feeds it.
// Elegant "document" styling with theme tokens only (no hex — rr UI rules).
import { useState } from "react";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  labels?: Partial<CertificateLabels>;
  className?: string;
};

/** Epoch ms → long Bahasa Indonesia date (e.g. "6 Juli 2026"). */
function formatEarned(earnedAt: number): string {
  return new Date(earnedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CertificateCard({
  certificate,
  shareUrl,
  labels,
  className,
}: CertificateCardProps) {
  const copy = { ...DEFAULT_CERTIFICATE_LABELS, ...labels };
  const [copied, setCopied] = useState(false);

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
        className="relative rounded-[var(--radius-win)] border border-border bg-card px-6 py-10 text-center shadow-sm @sm:px-12 @sm:py-14"
      >
        {/* Classic double-rule document frame — hairline, tokens only */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[calc(var(--radius-win)-0.25rem)] border border-border/70 @sm:inset-3"
        />

        {/* Medal + eyebrow */}
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20"
          >
            <Award className="size-7" />
          </span>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-serif text-2xl text-foreground @sm:text-3xl">
            {copy.heading}
          </h1>
        </div>

        <Separator className="mx-auto my-6 max-w-40" />

        {/* Recipient — the big serif name (the certificate's true headline) */}
        <p className="text-sm text-muted-foreground">{copy.awardedTo}</p>
        <p className="mt-2 break-words font-serif text-4xl leading-tight text-foreground @sm:text-5xl">
          {certificate.displayName}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">@{certificate.username}</p>

        {/* Course + community */}
        <p className="mt-7 text-sm text-muted-foreground">{copy.courseIntro}</p>
        <p className="mt-1 text-pretty font-serif text-xl italic text-primary @sm:text-2xl">
          {certificate.courseTitle}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {copy.communityPrefix}{" "}
          <span className="font-medium text-foreground">{certificate.tenantName}</span>
        </p>

        {/* Earned date — quiet, letterpress-style closing line */}
        <p className="mt-7 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {copy.earnedPrefix} {formatEarned(certificate.earnedAt)}
        </p>
      </article>

      {shareUrl ? (
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
