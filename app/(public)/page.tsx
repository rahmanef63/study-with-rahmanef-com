import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { HeroBackdrop } from "@/components/brand/hero-backdrop";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { tenantsApi, type PublicTenant } from "@/features/tenants";
import { api } from "@convex/_generated/api";
import { HeroCta } from "./hero-cta";

const convexOptions = { skipConvexDeploymentUrlCheck: true } as const;

const STEPS = [
  {
    title: "Masuk & pilih komunitas",
    body: "Login sekali pakai akun Google, lalu buka komunitas belajar yang paling cocok denganmu.",
  },
  {
    title: "Belajar per lesson",
    body: "Video singkat, materi tertulis, dan tautan sumber untuk tiap topik — satu lesson sekali duduk.",
  },
  {
    title: "Catat progress, lanjut kapan saja",
    body: "Tandai lesson selesai, progres tersimpan otomatis, dan lanjut diskusi bareng komunitas di Discord.",
  },
] as const;

const HERO_TAGS = ["Gratis selamanya", "Bahasa Indonesia", "Dipandu komunitas"] as const;

function CatalogEmpty() {
  return (
    <Empty className="mx-auto max-w-md">
      <EmptyHeader>
        <EmptyTitle>Belum ada komunitas aktif</EmptyTitle>
        <EmptyDescription>
          Komunitas pertama sedang dikurasi. Mau memulai satu?
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" size="sm">
          <Link href="/buka-komunitas">Buka komunitas</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

async function CommunityCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing-catalog");

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <CatalogEmpty />;
  }

  let catalog: { tenant: PublicTenant; courses: CourseCardData[] }[];
  try {
    const tenants = (await fetchQuery(
      tenantsApi.listActive,
      { limit: 6 },
      convexOptions
    )) as PublicTenant[];
    catalog = await Promise.all(
      tenants.map(async (tenant) => ({
        tenant,
        courses: (await fetchQuery(
          api.features.courses.queries.listPublished,
          { tenantId: tenant._id },
          convexOptions
        )) as CourseCardData[],
      }))
    );
  } catch {
    // Resilience: a Convex hiccup during prerender/build must not fail the
    // whole site build — degrade to the empty state (revalidates next cacheLife).
    return <CatalogEmpty />;
  }

  if (catalog.length === 0) {
    return <CatalogEmpty />;
  }

  return (
    <div className="space-y-12">
      {catalog.map(({ tenant, courses }) => (
        <section key={tenant._id} className="space-y-5">
          <div className="flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <h3 className="font-serif text-2xl">{tenant.name}</h3>
              <p className="mt-1 max-w-2xl text-pretty text-sm text-muted-foreground">
                {tenant.description}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/t/${tenant.slug}`}>Buka komunitas</Link>
            </Button>
          </div>
          {courses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  href={`/t/${tenant.slug}/kelas/${course.slug}`}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
              <p className="font-medium">Kelas pertama sedang disiapkan 🌱</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Buka komunitasnya untuk ikut sejak awal.
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero — code-generated warm mesh backdrop, editorial display type. */}
      <section className="relative isolate overflow-hidden border-b">
        <HeroBackdrop />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:py-24 lg:py-32">
          <span className="eyebrow">Komunitas belajar AI · Bahasa Indonesia</span>
          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
            Belajar pakai AI,{" "}
            <em className="italic text-primary">bareng-bareng</em>, gratis.
          </h1>
          <p className="max-w-xl text-pretty text-lg text-muted-foreground sm:text-xl">
            Kelas praktis pengaplikasian AI untuk sehari-hari, kerja, dan usaha —
            berbahasa Indonesia, dipandu komunitas, tanpa biaya.
          </p>
          <HeroCta />
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {HERO_TAGS.map((tag) => (
              <li key={tag} className="flex items-center gap-1.5">
                <span aria-hidden className="text-primary">
                  ✓
                </span>
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cara kerjanya — editorial numbered grid with hairline dividers. */}
      <section id="cara-kerja" className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow">Cara kerjanya</span>
            <h2 className="mt-2 text-3xl sm:text-4xl">Tiga langkah tenang.</h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Tanpa biaya, tanpa ribet — dari daftar sampai lanjut belajar kapan saja.
            </p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="reveal-on-scroll flex flex-col gap-3 bg-background p-6 sm:p-8"
              >
                <span className="font-serif text-4xl leading-none text-primary/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Komunitas catalog */}
      <section id="komunitas" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">Komunitas</span>
          <h2 className="mt-2 text-3xl sm:text-4xl">Pilih tempat belajarmu.</h2>
        </div>
        <CommunityCatalog />
      </section>

      {/* Tentang — editorial pull quote */}
      <section id="tentang" className="border-t bg-muted/30">
        <div className="reveal-on-scroll mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <span className="eyebrow">Kenapa platform ini ada</span>
          <p className="mt-4 border-l-2 border-primary pl-5 font-serif text-xl leading-relaxed text-pretty sm:text-2xl">
            Materi AI kebanyakan berbahasa Inggris, tersebar, dan terlalu teknis.
            Di sini kamu belajar <em className="italic">pengaplikasiannya</em> langsung
            — video singkat, materi tertulis, progress tercatat, dan diskusi di
            Discord. Untuk fundamental yang proper, tiap lesson menautkan sumber
            belajarnya.
          </p>
        </div>
      </section>
    </>
  );
}
