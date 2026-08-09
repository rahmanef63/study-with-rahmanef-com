import type { Metadata } from "next";
import { CHANGELOG, type ChangelogEntry } from "@/lib/changelog-data";

// Changelog — static seed data, zero queries, so the whole page prerenders.
// No Suspense boundary is needed: nothing here awaits dynamic data.
const TITLE = "Changelog";
const DESCRIPTION =
  "Catatan setiap pembaruan platform — biar gampang mengikuti apa yang berubah.";

const TAG_STYLE: Record<string, string> = {
  Baru: "bg-primary/10 text-primary",
  Tampilan: "bg-chart-2/15 text-foreground",
  Perbaikan: "bg-chart-4/15 text-foreground",
  Konten: "bg-chart-5/15 text-foreground",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/changelog" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/changelog" },
};

function fmtDate(iso: string): string {
  // Bahasa Indonesia long date; falls back to the raw string if unparseable.
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function Entry({ e }: { e: ChangelogEntry }) {
  return (
    <article className="relative border-l border-border pl-6">
      <span className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <time
          dateTime={e.date}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {fmtDate(e.date)}
        </time>
        {e.version ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {e.version}
          </span>
        ) : null}
        {e.tags?.map((t) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TAG_STYLE[t] ?? "bg-muted text-muted-foreground"}`}
          >
            {t}
          </span>
        ))}
      </div>
      <h2 className="mt-1.5 font-serif text-lg font-semibold">{e.title}</h2>
      <ul className="mt-2 space-y-1.5">
        {e.points.map((p, i) => (
          <li key={`${e.date}-${i}`} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
            <span className="text-pretty">{p}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ChangelogPage() {
  return (
    <main className="@container mx-auto w-full max-w-3xl px-6 py-12">
      <header className="mb-10 space-y-2">
        <span className="eyebrow">Platform</span>
        <h1 className="font-serif text-3xl @sm:text-4xl">{TITLE}</h1>
        <p className="max-w-xl text-pretty text-muted-foreground">{DESCRIPTION}</p>
      </header>
      <div className="space-y-8">
        {CHANGELOG.map((e) => (
          <Entry key={e.date + e.title} e={e} />
        ))}
      </div>
    </main>
  );
}
