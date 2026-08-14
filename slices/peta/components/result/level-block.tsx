"use client";
// The verdict, up top. Level first because it is the question they came with
// ("where am I?"), then the SENTENCE that earns it — the engine cites how many
// cards they knew out of how many were asked, so the label reads as a
// measurement rather than as flattery.
import type { PetaResult } from "@/lib/peta";

const LEVEL_TONE: Record<PetaResult["level"], string> = {
  pemula: "border-accent text-accent",
  terbiasa: "border-accent text-accent",
  menengah: "border-primary text-primary",
  lanjut: "border-success text-success",
};

export function LevelBlock({ result }: { result: PetaResult }) {
  return (
    <header className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-md">
      <span className="eyebrow">Peta belajar kamu</span>
      {/* h2, not h1: the page's one h1 is server-rendered in app/mulai/page.tsx
          so a crawler gets it whether or not the client island has hydrated.
          Body face — the headline is a whole sentence, and Press Start 2P is
          display-ONLY in this design system. */}
      <h2 className="mt-2 text-balance font-sans text-headline font-medium normal-case tracking-normal">
        {result.headline}
      </h2>
      <p className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center border px-2.5 py-1 font-display text-caption uppercase ${LEVEL_TONE[result.level]}`}
        >
          {result.levelLabel}
        </span>
      </p>
      <p className="mt-3 text-pretty text-body text-muted-foreground">{result.levelReason}</p>
    </header>
  );
}
