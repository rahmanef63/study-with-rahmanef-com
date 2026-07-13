"use client";
// Kelola — the OS "management console" app (instructor+). One window, internal
// tabs driven by React state (NOT new windows): Kelas · Kuis · Komunitas ·
// Pengumuman. Every tab mounts the real management view from a slice barrel —
// no CRUD is reimplemented here. Renders inside an appshell window, so data is
// fetched client-side via the slice hooks (root layout already mounts Convex).
//
// Gating mirrors the /t/[slug]/kelola/* routes: this is the UX gate only — the
// server authz on each Convex mutation/query is the real guard. Payload shape:
// { tenantSlug: string } (whoever opened the window supplies it).
import { useState } from "react";
import { BookOpen, ListChecks, Lock, Megaphone, Users, type LucideIcon } from "lucide-react";
import type { AppProps } from "@/features/appshell";
import { AnnouncementsView } from "@/features/announcements";
import { seg } from "./_nav";
import { TenantSettingsView, useMyMembership, useTenantBySlug } from "@/features/tenants";
import { Hero, SectionHeader } from "@/components/mockup-kit";
import { KelolaEmpty, KelolaSkeleton } from "./kelola-parts";
import { KelolaKelasTab } from "./kelola-kelas-tab";
import { KelolaKuisTab } from "./kelola-kuis-tab";
import { KelolaStatistikTab } from "./kelola-statistik-tab";

type TabKey = "kelas" | "kuis" | "statistik" | "komunitas" | "pengumuman";

const TABS: { key: TabKey; label: string; icon: LucideIcon; blurb: string }[] = [
  { key: "kelas", label: "Kelas", icon: BookOpen, blurb: "Susun kelas, modul, dan materi." },
  { key: "kuis", label: "Kuis", icon: ListChecks, blurb: "Bangun bank soal per modul." },
  { key: "statistik", label: "Statistik", icon: ListChecks, blurb: "Progress & hasil kuis per kelas." },
  { key: "komunitas", label: "Komunitas", icon: Users, blurb: "Atur profil & identitas komunitas." },
  {
    key: "pengumuman",
    label: "Pengumuman",
    icon: Megaphone,
    blurb: "Kirim kabar ke seluruh anggota.",
  },
];

export default function KelolaApp(props: AppProps) {
  // Deep-link path: /kelola/<tenantSlug>
  const [tenantSlug] = seg(props.payload);

  if (!tenantSlug) {
    return (
      <div className="w-full p-6 @md:p-8">
        <KelolaEmpty
          icon={Lock}
          title="Komunitas tak dikenal"
          body="Buka Kelola dari komunitas yang kamu kelola."
        />
      </div>
    );
  }

  return <KelolaConsole tenantSlug={tenantSlug} />;
}

function KelolaConsole({ tenantSlug }: { tenantSlug: string }) {
  const tenant = useTenantBySlug(tenantSlug);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenant?._id);
  const [tab, setTab] = useState<TabKey>("kelas");

  // Anon branch (#20, zeta's #13 finding): while logged OUT the membership
  // query is skipped, so `membership` never resolves — show a login gate
  // instead of an endless skeleton. e2e spec 6 tightens once this ships.
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="w-full p-6 @md:p-8">
        <KelolaEmpty
          icon={Lock}
          title="Masuk untuk mengelola"
          body="Konsol pengelola butuh login. Buka /masuk lalu kembali ke sini."
        />
      </div>
    );
  }

  if (tenant === undefined || isAuthLoading || membership === undefined) {
    return (
      <div className="w-full space-y-6 p-6 @md:p-8">
        <KelolaSkeleton lines={4} />
      </div>
    );
  }

  if (tenant === null) {
    return (
      <div className="w-full p-6 @md:p-8">
        <KelolaEmpty
          icon={Lock}
          title="Komunitas tak ditemukan"
          body="Komunitas ini mungkin sudah tidak aktif."
        />
      </div>
    );
  }

  const canManage = membership?.role === "instructor" || membership?.role === "owner";
  if (!canManage) {
    return (
      <div className="w-full p-6 @md:p-8">
        <KelolaEmpty
          icon={Lock}
          title="Khusus pengelola"
          body="Konsol ini hanya untuk instruktur atau owner komunitas."
        />
      </div>
    );
  }

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div className="w-full space-y-6 p-6 @md:p-8">
      <Hero
        eyebrow={<>Konsol pengelola · {tenant.name}</>}
        title={
          <>
            Kelola <em className="italic text-primary">komunitas</em>.
          </>
        }
        description="Atur kelas, kuis, profil komunitas, dan pengumuman dari satu tempat."
      >
        <div role="tablist" aria-label="Menu kelola" className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(key)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            );
          })}
        </div>
      </Hero>

      <section className="min-w-0 space-y-5">
        <SectionHeader
          title={active.label}
          actions={
            <span className="hidden max-w-xs truncate text-sm text-muted-foreground @md:block">
              {active.blurb}
            </span>
          }
        />
        <div className="min-w-0">
          {tab === "kelas" ? <KelolaKelasTab tenantId={tenant._id} /> : null}
          {tab === "kuis" ? <KelolaKuisTab tenantId={tenant._id} /> : null}
          {tab === "statistik" ? <KelolaStatistikTab tenantId={tenant._id} /> : null}
          {tab === "komunitas" ? <TenantSettingsView slug={tenant.slug} /> : null}
          {tab === "pengumuman" ? <AnnouncementsView tenantId={tenant._id} canManage /> : null}
        </div>
      </section>
    </div>
  );
}
