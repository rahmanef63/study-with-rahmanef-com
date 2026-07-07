"use client";
// Beranda — the OS "home" app: browse active komunitas + their published kelas.
// Reuses the courses/tenants slice barrels for data; a course click opens the
// Kelas app in its own window (openWindow). Renders inside an appshell window,
// so it fetches client-side via useQuery (root layout already mounts Convex).
import { useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import { tenantsApi, type PublicTenant } from "@/features/tenants";
import { openApp } from "./_nav";
import { type CourseCardData } from "@/features/courses";
import { api } from "@convex/_generated/api";

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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <button
          key={course._id}
          type="button"
          onClick={() => openApp("kelas", course.title, [tenant.slug, course.slug])}
          className="group flex min-h-11 flex-col gap-1.5 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-serif text-base font-medium text-pretty group-hover:text-primary">
            {course.title}
          </span>
          {course.description ? (
            <span className="line-clamp-2 text-sm text-muted-foreground">{course.description}</span>
          ) : null}
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
    <div className="mx-auto w-full max-w-4xl space-y-10 p-6 sm:p-8">
      <header className="space-y-2">
        <span className="eyebrow">Komunitas belajar AI · Bahasa Indonesia</span>
        <h1 className="text-3xl sm:text-4xl">
          Belajar pakai AI, <em className="italic text-primary">bareng-bareng</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Pilih komunitas, buka kelasnya, dan catat progresmu — gratis, berbahasa Indonesia.
        </p>
      </header>

      {tenants === undefined ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/50" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
          Belum ada komunitas aktif. Komunitas pertama sedang dikurasi.
        </p>
      ) : (
        tenants.map((tenant) => (
          <section key={tenant._id} className="space-y-4">
            <div className="flex flex-col gap-1 border-b pb-3">
              <h2 className="font-serif text-2xl">{tenant.name}</h2>
              {tenant.description ? (
                <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
                  {tenant.description}
                </p>
              ) : null}
            </div>
            <KelasGrid tenant={tenant} />
          </section>
        ))
      )}
    </div>
  );
}
