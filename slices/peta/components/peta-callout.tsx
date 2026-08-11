// The invitation, as a presentational block. No hooks, no session, no
// "use client" — it renders identically in a server page (the /komunitas
// directory) and inside the gated client card on a community home.
//
// The copy answers the ONE sentence the owner wrote down: "orang tidak tahu
// mau belajar apa dan setiap orang punya kasus dan modal yang berbeda-beda."
// So it names the three things a catalogue of six courses cannot: your level,
// your case, your budget.
import Link from "next/link";
import { Compass } from "lucide-react";

export const PETA_HREF = "/mulai";

export type PetaCalloutProps = {
  /** `compact` drops the lead paragraph — for a page that already explains
   *  itself, like the community directory. */
  variant?: "full" | "compact";
  className?: string;
};

export function PetaCallout({ variant = "full", className }: PetaCalloutProps) {
  return (
    <Link
      href={PETA_HREF}
      className={`group flex min-h-14 items-center gap-4 border-2 border-primary/50 bg-primary/5 px-4 py-4 transition-colors duration-75 [transition-timing-function:steps(2,end)] hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ""}`}
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center border-2 border-primary/60 text-primary"
      >
        <Compass className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-caption uppercase text-primary">
          Belum tahu mau mulai dari mana?
        </span>
        {variant === "full" ? (
          <span className="mt-1 block text-pretty text-footnote text-muted-foreground">
            Jawab beberapa pertanyaan singkat. Kami susun rencana sesuai levelmu, pekerjaanmu, dan
            budgetmu — gratis, tanpa akun.
          </span>
        ) : (
          <span className="mt-1 block text-footnote text-muted-foreground">
            Buat peta belajarmu — gratis, tanpa akun.
          </span>
        )}
      </span>
      <span aria-hidden className="list-chevron shrink-0 text-primary" />
    </Link>
  );
}
