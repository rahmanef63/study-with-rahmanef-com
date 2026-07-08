"use client";
// Beranda — the OS "home" app: browse active komunitas + their published kelas.
// Reuses the courses/tenants slice barrels for data; a course click opens the
// Kelas app in its own window (openWindow). Renders inside an appshell window,
// so it fetches client-side via useQuery (root layout already mounts Convex).
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { BookOpen, ArrowRight } from "lucide-react";
import { type AppProps } from "@/features/appshell";
import { tenantsApi, type PublicTenant } from "@/features/tenants";
import { openApp } from "./_nav";
import { getRecentCourses, type RecentCourse } from "../recent-courses";
import { type CourseCardData } from "@/features/courses";
import { api } from "@convex/_generated/api";
import { Hero, SectionHeader, Badge } from "@/components/mockup-kit";

/** "Lanjutkan belajar" — one-click resume of recently opened courses. Reads
 *  localStorage, so it is client-only: we start empty and hydrate after mount
 *  (useState + useEffect) to avoid an SSR hydration mismatch. Renders nothing
 *  until the user has opened at least one course. */
function LanjutkanBelajar() {
  const [recents, setRecents] = useState<RecentCourse[]>([]);
  useEffect(() => {
    setRecents(getRecentCourses());
  }, []);

  if (recents.length === 0) return null;

  return (
    <section aria-label="Lanjutkan belajar">
      <SectionHeader
        eyebrow="Lanjut dari terakhir"
        title="Lanjutkan belajar"
        actions={<Badge tone="accent">{recents.length} tersimpan</Badge>}
      />
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 @sm:flex-wrap @sm:overflow-visible">
        {recents.map((c) => (
          <button
            key={`${c.tenantSlug}/${c.courseSlug}`}
            type="button"
            onClick={() => openApp("kelas", c.title, [c.tenantSlug, c.courseSlug])}
            className="group flex min-h-11 max-w-xs shrink-0 items-center gap-2.5 rounded-full border border-border bg-card py-2.5 pl-3 pr-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <BookOpen aria-hidden className="size-3.5" />
            </span>
            <span className="min-w-0 truncate text-pretty text-sm font-medium group-hover:text-primary">
              {c.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function KelasGrid({ tenant }: { tenant: PublicTenant }) {
  const courses = useQuery(api.features.courses.queries.listPublished, {
    tenantId: tenant._id,
  }) as CourseCardData[] | undefined;

  if (courses === undefined) {
    return <div className="h-24 animate-pulse rounded-xl bg-muted/50" />;
  }
  if (courses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        Kelas pertama sedang disiapkan 🌱
      </p>
    );
  }
  return (
    <div className="grid gap-3 @sm:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4">
      {courses.map((course) => (
        <button
          key={course._id}
          type="button"
          onClick={() => openApp("kelas", course.title, [tenant.slug, course.slug])}
          className="group flex min-h-11 flex-col gap-2 rounded-[var(--radius-win)] border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-start gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-win)] bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <BookOpen aria-hidden className="size-4" />
            </span>
            <span className="min-w-0 font-serif text-base font-medium text-pretty group-hover:text-primary">
              {course.title}
            </span>
          </span>
          {course.description ? (
            <span className="line-clamp-2 text-sm text-muted-foreground">{course.description}</span>
          ) : null}
          <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            Buka kelas
            <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      ))}
    </div>
  );
}

export default function BerandaApp(_props: AppProps) {
  const tenants = useQuery(tenantsApi.listActive, { limit: 12 }) as
    | PublicTenant[]
    | undefined;

  return (
    <div className="w-full space-y-10 p-6 @sm:p-8">
      <Hero
        align="center"
        eyebrow="Komunitas belajar AI · Bahasa Indonesia"
        title={
          <>
            Belajar pakai AI, <em className="italic text-primary">bareng-bareng</em>.
          </>
        }
        description="Pilih komunitas, buka kelasnya, dan catat progresmu — gratis, berbahasa Indonesia."
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone="accent">Gratis</Badge>
          <Badge tone="muted">Bahasa Indonesia</Badge>
          <Badge tone="muted">Belajar bareng</Badge>
        </div>
      </Hero>

      <LanjutkanBelajar />

      {tenants === undefined ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[var(--radius-win)] bg-muted/50" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <p className="rounded-[var(--radius-win)] border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
          Belum ada komunitas aktif. Komunitas pertama sedang dikurasi.
        </p>
      ) : (
        tenants.map((tenant) => (
          <section key={tenant._id} aria-label={tenant.name}>
            <SectionHeader
              eyebrow={tenant.track ?? "Komunitas"}
              title={tenant.name}
            />
            {tenant.description ? (
              <p className="mb-4 max-w-2xl text-pretty text-sm text-muted-foreground">
                {tenant.description}
              </p>
            ) : null}
            <KelasGrid tenant={tenant} />
          </section>
        ))
      )}
    </div>
  );
}
