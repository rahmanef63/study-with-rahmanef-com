import type { Metadata } from "next";
import { Suspense } from "react";
import { PETA_CODE_PARAM, PetaView } from "@/features/peta";
import { Skeleton } from "@/components/ui/skeleton";
import { readCatalogue } from "./catalogue";

// /mulai — the widest door into the product.
//
// It exists because a newcomer lands on a catalogue of six courses and
// bounces: "orang tidak tahu mau belajar apa dan setiap orang punya kasus dan
// modal yang berbeda-beda." Six courses cannot answer that. Ten questions can.
//
// NO GATE, EVER. This page never reads a session, never redirects to /masuk
// and never shows a join wall — a stranger on a phone must be able to finish
// it and leave with a plan. Server components here are anonymous anyway
// (tokens live in localStorage), which makes the rule easy to keep.
//
// The HEADING AND LEAD ARE SERVER HTML on purpose: the deck below is a client
// island that cannot render until localStorage is read, so without this the
// page would ship to a crawler as an empty div. It also means the h1 is stable
// across all three client states — the deck and the result both start at h2.
const TITLE = "Peta belajar";
const DESCRIPTION =
  "Jawab beberapa pertanyaan singkat, lalu dapat rencana belajar AI yang sesuai levelmu, pekerjaanmu, dan budgetmu. Gratis, tanpa akun.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mulai" },
  // No `openGraph` key. Declaring one without `images` suppresses the inherited
  // card, which is how /diskusi and /komunitas shipped with no og:image at all;
  // this is the most shareable page on the site and must not repeat it.
};

function DeckSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

async function Deck({ code }: { code?: string }) {
  // Plain data only. A function prop cannot cross server→client, and this
  // boundary has broken the app three times before.
  const catalogue = await readCatalogue();
  return <PetaView catalogue={catalogue} sharedCode={code} />;
}

export default async function MulaiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params[PETA_CODE_PARAM];
  const code = Array.isArray(raw) ? raw[0] : raw;

  return (
    // max-w-2xl: one question per screen wants a reading column, not a page.
    // The bottom padding clears the home indicator on an installed PWA.
    <main className="@container mx-auto w-full max-w-2xl px-4 py-8 pb-[calc(3rem+var(--safe-b))]">
      <header className="mb-6 space-y-2">
        <span className="eyebrow">Peta belajar</span>
        <h1 className="text-balance">Mau mulai dari mana?</h1>
        <p className="text-pretty text-body text-muted-foreground">{DESCRIPTION}</p>
      </header>
      <Suspense fallback={<DeckSkeleton />}>
        <Deck code={code} />
      </Suspense>
    </main>
  );
}
