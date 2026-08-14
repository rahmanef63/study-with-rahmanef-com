import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EXPLORE_LINKS } from "@/components/shell";
import { BerandaView } from "../../_components/beranda-view";

// THE HOME SCREEN. Where "Jelajah" went.
//
// Those three destinations — Komunitas, Roadmap, Peta belajar — used to be a
// permanent group in the rail, under the community's own tabs. That is a lot of
// standing chrome for three places a reader goes deliberately and occasionally,
// and it made the rail a mix of "where I am" and "where else there is". They
// are cards here instead: one tap from the Beranda button, and with room for
// the sentence that says what each one is for, which a 44px row never had.
//
// TWO HALVES, AND THE TOP ONE IS ANONYMOUS. The explore cards are server-
// rendered from `EXPLORE_LINKS` — the same list the rail used, so the two can
// never drift — and they render for everyone. The summary below is a client
// island because it is the caller's own state and this server is permanently
// anonymous; it simply is not there for a signed-out reader, who gets the cards
// and nothing that implies a session they do not have.
//
// THE ART IS AN ICON, NOT A SPRITE, and that is a legibility result rather
// than a taste one. These cards render their mark at 56px, and rendered at 56px
// `discovery.webp` is a brown smudge and `anggota.webp` is a dashed speech
// bubble over a campfire that collapses into noise — the same sprite, at the
// same failure, that already had to be pulled out of the 44px stat row in
// 4869291. `EXPLORE_LINKS` has carried a Lucide icon per destination all along
// for the rail, so the fix deletes a lookup table rather than adding one.
const TITLE = "Beranda";
const DESCRIPTION =
  "Ringkasan belajarmu — kelas yang sedang jalan, komunitas yang kamu ikuti, dan ke mana lagi kamu bisa pergi.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/home" },
  // Signed-out this page is three links; signed-in it is somebody's private
  // progress. Neither is worth indexing, and the second must not be.
  robots: { index: false, follow: true },
};

/** One line each, because a card has room for the thing a nav row could not say. */
const BLURB: Record<string, string> = {
  komunitas: "Semua komunitas belajar yang aktif. Gratis, terbuka, berbahasa Indonesia.",
  roadmap: "Seluruh jalur belajar sekaligus — dari nol sampai menjalankan beberapa agent AI.",
  peta: "Jawab beberapa kartu, keluar dengan dua sampai tiga rencana belajar yang cocok denganmu.",
};

/** The framed accent tile every card mark sits in. Same idiom as
 *  slices/peta/components/peta-callout.tsx. */
const TILE =
  "grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border border-primary/40 bg-primary/10 text-primary";

export default function BerandaPage() {
  return (
    <div className="@container mx-auto w-full max-w-4xl">
      <header className="space-y-2">
        <span className="eyebrow">Ringkasan</span>
        <h1 className="font-display text-lg @sm:text-xl">{TITLE}</h1>
        <p className="max-w-xl text-pretty text-body text-muted-foreground">{DESCRIPTION}</p>
      </header>

      <div className="mt-8">
        <BerandaView />
      </div>

      <section className="mt-10 border-t pt-8">
        <h2 className="eyebrow">Jelajah</h2>
        <ul className="mt-3 grid gap-3 @2xl:grid-cols-3">
          {EXPLORE_LINKS.map((link) => (
            <li key={link.key}>
              <Link
                href={link.href}
                className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <span className={TILE}>
                  <link.icon className="size-5" aria-hidden />
                </span>
                <span className="mt-3 text-title font-medium group-hover:text-primary">
                  {link.label}
                </span>
                <span className="mt-1 flex-1 text-pretty text-footnote text-muted-foreground">
                  {BLURB[link.key]}
                </span>
                <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-title font-medium text-primary">
                  Buka
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
