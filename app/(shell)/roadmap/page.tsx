import type { Metadata } from "next";
import Link from "next/link";
import { ART_SIZE } from "@/lib/art";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { PATHS } from "@/lib/peta";
import { communityHref } from "@/lib/community";
import { absoluteUrl } from "@/lib/site";
import { readCatalogue } from "../mulai/catalogue";
import { indexCatalogue } from "@/features/peta";

// /roadmap — the whole map, laid out at once.
//
// The owner asked to see "roadmap.sh atau semacamnya". roadmap.sh's CONTENT
// cannot be reused: its licence is all rights reserved — "not allowed to use it
// for any other purpose including publishing the content in any form". Linking
// to it is expressly fine, and a learning path's STRUCTURE is not copyrightable
// anyway, so this is our own map, in our own words, over our own courses.
//
// WHY IT IS NOT A DUPLICATE OF ANYTHING. /mulai answers "what should I learn?"
// for ONE person and hides the other seven paths. A course's Silabus answers
// "what is in this course?". Neither shows the shape of the whole subject, and
// that is the thing a roadmap is for: seeing that there IS an order, and where
// you are in it, before committing to anything.
//
// SERVER-RENDERED AND ANONYMOUS on purpose. This is a page a stranger should be
// able to read, share and find in a search result without an account — the same
// reasoning that keeps /mulai out of the dashboard shell.
const TITLE = "Roadmap belajar AI";
const DESCRIPTION =
  "Peta lengkap jalur belajar AI di platform ini — dari nol sampai menjalankan beberapa agent sekaligus. Pilih jalurmu, atau jawab beberapa pertanyaan dan biar kami yang pilihkan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/roadmap" },
  // No `openGraph` key: declaring one without `images` suppresses the inherited
  // card, which is how /diskusi and /komunitas ended up with no og:image at all.
};

/** Free, genuinely reusable references. Linked, never copied. */
const OUTSIDE = [
  {
    href: "https://roadmap.sh/ai-engineer",
    label: "roadmap.sh — AI Engineer",
    note: "Peta versi bahasa Inggris untuk yang mau jalur teknis. Isinya berhak cipta penuh, jadi kami tautkan, bukan salin.",
  },
  {
    href: "https://www.elementsofai.com/",
    label: "Elements of AI",
    note: "Kursus universitas Helsinki, gratis, konsep dasar tanpa koding.",
  },
  {
    href: "https://huggingface.co/learn",
    label: "Hugging Face Learn",
    note: "Kursus terbuka untuk yang sudah nyaman dengan Python.",
  },
];

export default async function RoadmapPage() {
  const catalogue = await readCatalogue();
  const index = indexCatalogue(catalogue);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(var(--safe-b)+3rem)] md:px-6">
      {/* THE TRAIL, DESKTOP ONLY — and `hidden` is doing real work, not styling.
          This page's whole job is to get someone reading the eight paths below;
          a 720px-tall illustration above them would eat a 390px phone's entire
          first screen, the same measurement that capped the landing hero to
          h-44. From `md` there is a column going spare, so it costs nothing.

          It is also the ONE asset in the cover pack with a home. The other ten
          bake an ENGLISH title into the pixels; this one's five station labels
          are already Bahasa — 1. DASAR through 5. MAHIR — and already say what
          the page says. Cropped from x=0.50 of the archived original, measured:
          the title's tallest glyph stroke ends at column 829 of 1672 (0.496).
          See docs/ASSETS.md §9.4. */}
      <div className="md:grid md:grid-cols-[1fr_minmax(0,15rem)] md:items-start md:gap-8">
        <div className="min-w-0">
          <p className="eyebrow">Peta</p>
          <h1 className="mt-2 text-balance font-display text-lg leading-snug @sm:text-xl">{TITLE}</h1>
          <p className="mt-4 text-pretty text-body text-muted-foreground">{DESCRIPTION}</p>

          <Link
            href="/mulai"
            className="pixel-press mt-6 inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 text-title font-medium text-primary-foreground shadow-[3px_3px_0_0_var(--pixel-shadow)]"
          >
            Belum yakin? Jawab beberapa kartu
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
        <img
          src="/learning/cover/roadmap-trail.webp"
          alt=""
          width={640}
          height={720}
          loading="lazy"
          decoding="async"
          className="pixelated hidden w-full border-2 border-border object-cover object-right md:block"
        />
      </div>

      <ol className="mt-10 space-y-8">
        {PATHS.map((path, i) => {
          const community = index.community.get(path.communitySlug);
          return (
            <li key={path.id} className="border-2 border-border bg-card p-4 md:p-5">
{/* eslint-disable-next-line @next/next/no-img-element -- committed static asset. */}
              <img src={path.art} alt="" width={ART_SIZE.card} height={ART_SIZE.card} loading="lazy" decoding="async" className="pixelated size-14 object-contain" />
              <div className="mt-3 flex items-baseline gap-3">
                <span aria-hidden className="font-display text-caption text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-balance text-headline font-medium">{path.title}</h2>
              </div>
              <p className="mt-2 text-pretty text-footnote text-muted-foreground">{path.summary}</p>

              {/* The trail. A numbered list is the honest markup for "do these
                  in this order", and it degrades to exactly that with CSS off. */}
              <ol className="mt-4 space-y-0">
                {path.courses.map((course, step) => {
                  const live = index.courseTitle.get(`${path.communitySlug}/${course.courseSlug}`);
                  const last = step === path.courses.length - 1;
                  return (
                    <li key={course.courseSlug} className="flex gap-3">
                      {/* The rail: a node and the line to the next one. */}
                      <div className="flex flex-col items-center" aria-hidden>
                        <span className="mt-1 size-3 shrink-0 border-2 border-primary bg-background" />
                        {last ? null : <span className="w-0.5 flex-1 bg-border" />}
                      </div>
                      <div className={last ? "pb-0" : "pb-4"}>
                        {live === undefined ? (
                          // Not published right now — named, never linked. A
                          // map that sends you to a 404 is worse than a map
                          // that admits a stop is closed.
                          <span className="text-title text-muted-foreground">
                            {course.title}{" "}
                            <span className="text-caption">(belum tersedia)</span>
                          </span>
                        ) : (
                          <Link
                            href={communityHref.course(path.communitySlug, course.courseSlug)}
                            className="text-title font-medium underline decoration-border underline-offset-4 hover:decoration-primary"
                          >
                            {live}
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {community === undefined ? null : (
                <p className="mt-3 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <Check className="size-3.5 shrink-0" aria-hidden />
                  Di komunitas{" "}
                  <Link
                    href={communityHref.home(path.communitySlug)}
                    className="underline underline-offset-4"
                  >
                    {community.name}
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-12">
        <h2 className="eyebrow">Sumber lain</h2>
        <p className="mt-2 text-pretty text-footnote text-muted-foreground">
          Gratis, dan bukan milik kami — kami tautkan supaya kamu bisa membandingkan.
        </p>
        <ul className="mt-4 space-y-3">
          {OUTSIDE.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-title font-medium underline decoration-border underline-offset-4 hover:decoration-primary"
              >
                {item.label}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
              <p className="text-caption text-muted-foreground">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
