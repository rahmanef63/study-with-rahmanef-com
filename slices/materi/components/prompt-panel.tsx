"use client";
// materi slice — the prompt panel. THE hero of a skill page.
//
// A skill exists to be taken away: the reader wants the prompt in their
// clipboard and a chat tab open, and everything else on the page is context
// for a decision they have usually already made. So the panel is the first
// thing under the title, the Salin button sits in its header where the thumb
// lands, and the explanation lives BELOW it in the ordinary materi body.
//
// MEMBER-ONLY, structurally: `promptText` only exists on `MateriDetail`
// (getBySlug, requireTenantRole member). The anonymous etalase projection has
// no such field, so an anonymous page cannot render this even by mistake —
// there is nothing to pass it.
//
// The prompt is NOT markdown. It renders in a <pre> exactly as stored: a
// prompt's line breaks, its `###` headers and its [placeholders] are the
// payload, and a markdown pass would eat them and copy something different
// from what the reader saw.
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";

export type PromptPanelProps = {
  /** `null`/`undefined` when a skill has no prompt yet — the panel says so
   *  rather than vanishing, because an empty hero is information. */
  promptText: string | null | undefined;
  copy?: MateriCopyOverride;
  className?: string;
};

export function PromptPanel({ promptText, copy: copyOverride, className }: PromptPanelProps) {
  const copy = mergeMateriCopy(copyOverride);
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const text = promptText ?? "";

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Insecure context or a denied permission. The text is right there and
      // selectable, so the honest response is to say "select it yourself".
      setState("failed");
    }
  };

  return (
    <section
      aria-label={copy.promptHeading}
      className={
        "border-2 border-border bg-card shadow-[3px_3px_0_0_var(--pixel-shadow)]" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-border px-3.5 py-2 md:px-4">
        <p className="font-display text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground">
          {copy.promptHeading}
        </p>
        {text === "" ? null : (
          <Button
            type="button"
            size="sm"
            onClick={salin}
            aria-label={copy.promptCopy}
            className="min-h-11 shrink-0 gap-1.5 @sm:min-h-9"
          >
            {state === "copied" ? (
              <>
                <Check className="size-3.5" aria-hidden />
                {copy.promptCopied}
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden />
                {copy.promptCopy}
              </>
            )}
          </Button>
        )}
      </div>

      {text === "" ? (
        <p className="px-3.5 py-6 text-center text-sm text-muted-foreground md:px-4">
          {copy.promptMissing}
        </p>
      ) : (
        <>
          {/* No inner scroll: the cap is 4 000 chars (~60 lines) and a
              scroll-inside-a-scroll on a phone is how you lose the page. */}
          <pre className="overflow-x-auto whitespace-pre-wrap px-3.5 py-3.5 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere] md:px-4">
            {text}
          </pre>
          <p
            // aria-live so the failure is announced, not just shown.
            aria-live="polite"
            className="border-t border-border px-3.5 py-2 text-[0.6875rem] leading-relaxed text-muted-foreground md:px-4"
          >
            {state === "failed" ? copy.promptCopyFailed : copy.promptHint}
          </p>
        </>
      )}
    </section>
  );
}
