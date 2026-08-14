import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Map, MessagesSquare } from "lucide-react";
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { DEFAULT_COMMUNITY_SLUG, communityHref } from "@/lib/community";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingCourses } from "../_components/landing-courses";

// The front door.
//
// `/` used to `redirect()` straight into the flagship community — a stopgap from
// the OS-shell removal, when there was nothing else to show. The cost was that
// a stranger arriving from a search result or a shared link landed inside a
// community feed with no idea what the place is, and the one clean asset in the
// brand pack (web/hero.webp) had nowhere to live.
//
// A MEMBER LOSES NOTHING: the first CTA is the community, one tap, and the rail
// and dock carry it on every screen. Server-rendered and anonymous throughout,
// so a crawler reads the same page a person does — this is the only route whose
// job is to be found.
const TITLE = "Belajar pakai AI, bareng-bareng";
const DESCRIPTION =
  "Komunitas dan kelas gratis untuk mempraktikkan AI dalam pekerjaan sehari-hari — berbahasa Indonesia, tanpa biaya, tanpa perlu bisa ngoding.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} — belajar-with-rahmanef.com` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // No `openGraph` key: declaring one without `images` suppresses the inherited
  // card, which is how /diskusi and /komunitas ended up unfurling bare.
};

// A FRAMED ICON, not a sprite. The earlier note here argued that 56px art
// beats "a 20px lucide glyph that reads as decoration"; the argument was sound
// and the premise was not, because it was never checked at 56px. Rendered at
// the size these cards actually use, `discovery.webp` is a brown smudge and
// `roadmap-path.webp` is a few faint dots — the picture the eye was supposed to
// land on is not legible enough to land on. In an accent tile a 20px glyph is
// not decoration: the tile is the mass, the glyph is the subject, and it reads
// at any size.
//
// The pixel art is NOT retired wholesale. It still carries the hero below, the
// 404/offline banner, and every empty state — all of them at 96px or more,
// where it is an illustration rather than an icon. That is the line: sprites
// illustrate, Lucide labels.

/** The framed accent tile every card mark sits in. Same idiom as
 *  slices/peta/components/peta-callout.tsx. */
const TILE =
  "grid size-11 shrink-0 place-items-center rounded-[var(--radius)] border border-primary/40 bg-primary/10 text-primary";

const STEPS = [
  {
    icon: Compass,
    title: "Belum tahu mau mulai dari mana?",
    body: "Jawab beberapa kartu tentang pekerjaan, waktu, dan budgetmu. Keluar dengan dua sampai tiga rencana belajar, bukan satu daftar panjang.",
    href: "/mulai",
    cta: "Buka peta belajar",
  },
  {
    icon: Map,
    title: "Sudah tahu arahnya?",
    body: "Roadmap menunjukkan seluruh jalur sekaligus — dari nol sampai menjalankan beberapa agent AI untuk satu proyek.",
    href: "/roadmap",
    cta: "Lihat roadmap",
  },
  {
    icon: MessagesSquare,
    title: "Belajar sendirian itu berat.",
    body: "Tanya, pamerkan hasil, dan bagikan sumber di Diskusi. Semua materi terbuka begitu kamu gabung — gratis, selamanya.",
    href: communityHref.diskusi(DEFAULT_COMMUNITY_SLUG),
    cta: "Lihat diskusi",
  },
];

export default async function LandingPage() {
  const stats = await safeQuery(api.features.tenants.queries.getPublicStatsBySlug, {
    slug: DEFAULT_COMMUNITY_SLUG,
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="grid items-center gap-8 py-6 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-10 md:py-10">
        <div className="min-w-0">
          <p className="eyebrow">Gratis · Bahasa Indonesia</p>
          {/* `title-content`, not the marquee face: this is the one sentence the
              whole page exists to deliver, and Press Start 2P at headline size
              runs to four uppercase lines on a phone. */}
          <h1 className="title-content mt-3 text-balance text-3xl @sm:text-4xl">{TITLE}</h1>
          <p className="mt-4 max-w-prose text-pretty text-body text-muted-foreground">
            {DESCRIPTION}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={communityHref.home(DEFAULT_COMMUNITY_SLUG)}
              className="pixel-press inline-flex min-h-11 items-center gap-2 border border-primary bg-primary px-5 text-title font-medium text-primary-foreground shadow-sm"
            >
              Masuk ke komunitas
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/mulai"
              className="pixel-press inline-flex min-h-11 items-center border border-border px-5 text-title font-medium hover:border-primary hover:text-primary"
            >
              Belum tahu mulai dari mana?
            </Link>
          </div>

          {stats === null ? null : (
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                [`${stats.courseCount}`, "kelas"],
                [`${stats.memberCount}${stats.memberCountCapped ? "+" : ""}`, "anggota"],
                ["100%", "gratis"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-marquee text-primary">{value}</dd>
                  <p className="text-caption text-muted-foreground">{label}</p>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* THE SCENE, not the full hero. web/hero.webp bakes "Learn AI by
            Building" and "PRACTICAL PROJECTS • REAL SKILLS • REAL IMPACT" into
            the artwork as raster ENGLISH prose, beside a wordmark the rail
            already carries. Cropping to the desk half keeps the mood and lets
            the sentences above be real text — selectable, translatable, and
            able to reflow at 390px. Same call as the 404 and offline art.
            `alt=""`: it is decoration; the heading beside it says the thing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/web/hero-scene.webp"
          alt=""
          width={1040}
          height={1080}
          fetchPriority="high"
          // MEASURED, and the first attempt was wrong: full-height and
          // order-first on a phone put the <h1> at y=533 and pushed the second
          // CTA past the fold — the whole first screen was decoration. Capped
          // to 176px below md so the headline lands near y=300 and both buttons
          // clear the fold, while the scene still sets the tone. Full square
          // from md, where there is a column to spare.
          className="order-first h-44 w-full border border-border object-cover object-center md:order-none md:h-auto"
        />
      </section>

      <section className="border-t py-8 md:py-10">
        <h2 className="eyebrow">Tiga cara mulai</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.href} className="flex flex-col rounded-[var(--radius)] border border-border bg-card p-5">
              <span className={TILE}>
                <step.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-balance text-title font-medium">{step.title}</h3>
              <p className="mt-2 flex-1 text-pretty text-footnote text-muted-foreground">
                {step.body}
              </p>
              <Link
                href={step.href}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-title font-medium text-primary hover:underline"
              >
                {step.cta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Its own boundary: the hero above needs no data and must not wait on a
          Convex round trip to paint. */}
      <Suspense
        fallback={
          <div className="border-t py-8 md:py-10">
            <Skeleton className="h-4 w-40" />
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-[3/2] w-full" />
              ))}
            </div>
          </div>
        }
      >
        <LandingCourses />
      </Suspense>
    </div>
  );
}
