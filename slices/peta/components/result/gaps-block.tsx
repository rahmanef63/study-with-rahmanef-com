"use client";
// What they did not know, and where to close it. At most four (the engine
// caps it) because a screen listing nine of your gaps is a demotivation
// machine, and the fifth item is never the one that moves.
//
// The one-line explanation under each gap is the card's own `reveal` — the
// text the deck deliberately WITHHELD while they were answering, because
// showing it before the swipe would have taught them the answer to the
// question being asked.
//
// `materi === null` means the platform does not teach this yet. It renders as
// exactly that, with a link to propose it, and never as an approximate link to
// something adjacent: a gap that sends you to the wrong page is worse than a
// gap that admits a hole. Four concepts are in that state today (api, rag,
// mcp, fine-tuning) and this list is the owner's content backlog, in public.
import Link from "next/link";
import { conceptById } from "@/lib/peta";
import type { KnowledgeGap } from "@/lib/peta";
import { communityHref } from "@/lib/community";

const TIER_LABEL = { dasar: "Dasar", menengah: "Menengah", lanjut: "Lanjut" } as const;

export type GapsBlockProps = {
  gaps: readonly KnowledgeGap[];
  /** Where "usulkan materi" goes — the community whose plan this is. */
  communitySlug: string;
};

export function GapsBlock({ gaps, communitySlug }: GapsBlockProps) {
  if (gaps.length === 0) {
    return (
      <section className="space-y-2">
        <h2>Yang belum kamu tahu</h2>
        <p className="text-pretty text-body text-muted-foreground">
          Tidak ada. Kamu tahu semua istilah yang kami tanyakan — langsung saja ke langkah
          mingguan di atas.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2>Yang belum kamu tahu</h2>
      <ul className="grid gap-3">
        {gaps.map((gap) => {
          const reveal = conceptById(gap.concept)?.reveal;
          return (
            <li key={gap.concept} className="rounded-[var(--radius)] border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-display text-caption uppercase">{gap.title}</h3>
                <span className="text-caption text-muted-foreground">{TIER_LABEL[gap.tier]}</span>
              </div>
              {reveal ? <p className="mt-2 text-pretty text-footnote">{reveal}</p> : null}
              <p className="mt-2 text-pretty text-footnote text-muted-foreground">{gap.why}</p>
              {gap.materi === null ? (
                <p className="mt-3 text-footnote text-muted-foreground">
                  Belum ada materinya di sini.{" "}
                  <Link
                    href={communityHref.diskusiKind(communitySlug, "usulan")}
                    className="text-primary underline underline-offset-4"
                  >
                    Usulkan materi ini
                  </Link>
                </p>
              ) : (
                <Link
                  href={communityHref.materiPage(gap.materi.communitySlug, gap.materi.materiSlug)}
                  className="mt-3 flex min-h-11 items-center gap-3 border border-border px-3 py-2 text-footnote transition-colors duration-75 [transition-timing-function:steps(2,end)] hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="min-w-0 flex-1">{gap.materi.title}</span>
                  <span aria-hidden className="list-chevron shrink-0" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
