import Link from "next/link";
import Image from "next/image";
import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import { Button } from "@/components/ui/button";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { tenantsApi, type PublicTenant } from "@/features/tenants";
import { api } from "@convex/_generated/api";

const convexOptions = { skipConvexDeploymentUrlCheck: true } as const;

async function CommunityCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("landing-catalog");

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <p className="text-center text-muted-foreground">Belum ada komunitas aktif.</p>;
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
    return <p className="text-center text-muted-foreground">Belum ada komunitas aktif.</p>;
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
            <p className="text-sm text-muted-foreground">Kelas pertama sedang disiapkan.</p>
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
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-6 py-20 text-left">
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

      <section id="komunitas" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Komunitas</h2>
        <CommunityCatalog />
      </section>

      <section id="tentang" className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Kenapa platform ini ada</h2>
        <p className="text-muted-foreground">
          Materi AI kebanyakan berbahasa Inggris, tersebar, dan terlalu teknis.
          Di sini kamu belajar <em>pengaplikasiannya</em> langsung — video singkat,
          materi tertulis, progress tercatat, dan diskusi di Discord. Untuk materi
          fundamental yang proper, tiap lesson menautkan sumber belajarnya.
        </p>
      </section>
    </>
  );
}
