import Link from "next/link";
import Image from "next/image";
import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { Button } from "@/components/ui/button";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { tenantsApi, type PublicTenant } from "@/features/tenants";
import { api } from "@convex/_generated/api";

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
    body: "Tandai lesson selesai, progres tersimpan otomatis, dan lanjutkan diskusi bareng komunitas di Discord.",
  },
] as const;

function CatalogEmpty() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <p className="font-medium">Belum ada komunitas aktif</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Komunitas pertama sedang dikurasi. Mau memulai satu?
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link href="/buka-komunitas">Buka komunitas</Link>
      </Button>
    </div>
  );
}

async function CommunityCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing-catalog");

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <CatalogEmpty />;
  }

  const tenants = (await fetchQuery(
    tenantsApi.listActive,
    { limit: 6 },
    convexOptions
  )) as PublicTenant[];
  const catalog = await Promise.all(
    tenants.map(async (tenant) => ({
      tenant,
      courses: (await fetchQuery(
        api.features.courses.queries.listPublished,
        { tenantId: tenant._id },
        convexOptions
      )) as CourseCardData[],
    }))
  );

  if (catalog.length === 0) {
    return <CatalogEmpty />;
  }

  return (
    <div className="space-y-10">
      {catalog.map(({ tenant, courses }) => (
        <section key={tenant._id} className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h3 className="text-xl font-semibold">{tenant.name}</h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {tenant.description}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/t/${tenant.slug}`}>Buka komunitas</Link>
            </Button>
          </div>
          {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      <section className="relative flex min-h-[min(70dvh,640px)] items-center overflow-hidden">
        <Image
          src="/images/learning-community-hero.png"
          alt="Komunitas Indonesia belajar menggunakan AI bersama"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/75" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-20 text-left">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Belajar pakai AI, bareng-bareng, gratis.
          </h1>
          <p className="max-w-xl text-lg text-foreground/80">
            Kelas praktis pengaplikasian AI untuk sehari-hari, kerja, dan usaha —
            berbahasa Indonesia, dipandu komunitas, tanpa biaya.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">Mulai belajar</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/#komunitas">Lihat komunitas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-3 text-center text-2xl font-semibold">Cara kerjanya</h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
            Tiga langkah tenang — tanpa biaya, tanpa ribet.
          </p>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="reveal-on-scroll rounded-xl border bg-background p-6 shadow-sm"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="komunitas" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Komunitas</h2>
        <CommunityCatalog />
      </section>

      <section id="tentang" className="reveal-on-scroll mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Kenapa platform ini ada</h2>
        <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
          Materi AI kebanyakan berbahasa Inggris, tersebar, dan terlalu teknis.
          Di sini kamu belajar <em>pengaplikasiannya</em> langsung — video singkat,
          materi tertulis, progress tercatat, dan diskusi di Discord. Untuk materi
          fundamental yang proper, tiap lesson menautkan sumber belajarnya.
        </p>
      </section>
    </>
  );
}
