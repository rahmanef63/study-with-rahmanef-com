"use client";

// The ONE share affordance in the product.
//
// Replaces the appshell "share target registry" whose only built-ins were
// "Copy as text" and "Download as file" (English labels, inside an all-Bahasa
// product, reachable from exactly one of seventeen apps) plus two bespoke copy
// buttons in the profiles slice.
//
// navigator.share first: on a phone that is a one-tap hand-off to WhatsApp,
// which is how this audience actually shares things. Desktop browsers mostly
// lack it, so the fallback copies the link. Both paths are native platform
// APIs — no dependency, no sheet, no registry.
import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TombolBagikanProps = {
  /** Absolute URL to share. Must be absolute — a relative href is useless in
   *  a WhatsApp message. */
  url: string;
  title: string;
  /** Optional one-line context prepended in the share sheet. */
  text?: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
};

export function TombolBagikan({
  url,
  title,
  text,
  className,
  variant = "outline",
}: TombolBagikanProps) {
  const [copied, setCopied] = useState(false);

  const bagikan = async () => {
    // Feature-detected per click, not per render: `navigator` does not exist
    // during SSR and the check must not desync hydration.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // AbortError (user dismissed the sheet) and NotAllowedError both land
        // here; fall through to copying rather than showing an error.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permission). Nothing useful to
      // do — the URL is in the address bar.
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={bagikan}
      aria-label={`Bagikan ${title}`}
      className={cn("min-h-9 gap-1.5 rounded-full", className)}
    >
      {copied ? (
        <>
          <Check className="size-3.5" aria-hidden />
          Tautan disalin
        </>
      ) : (
        <>
          <Share2 className="size-3.5" aria-hidden />
          Bagikan
        </>
      )}
    </Button>
  );
}
