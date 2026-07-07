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
import { KelolaEmpty, KelolaSkeleton } from "./kelola-parts";
import { KelolaKelasTab } from "./kelola-kelas-tab";
import { KelolaKuisTab } from "./kelola-kuis-tab";

type TabKey = "kelas" | "kuis" | "komunitas" | "pengumuman";

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "kelas", label: "Kelas", icon: BookOpen },
  { key: "kuis", label: "Kuis", icon: ListChecks },
  { key: "komunitas", label: "Komunitas", icon: Users },
  { key: "pengumuman", label: "Pengumuman", icon: Megaphone },
];

export default function KelolaApp(props: AppProps) {
  // Deep-link path: /kelola/<tenantSlug>
  const [tenantSlug] = seg(props.payload);

  if (!tenantSlug) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
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
  const { membership, isAuthLoading } = useMyMembership(tenant?._id);
  const [tab, setTab] = useState<TabKey>("kelas");

  if (tenant === undefined || isAuthLoading || membership === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6 sm:p-8">
        <KelolaSkeleton lines={4} />
      </div>
    );
  }

  if (tenant === null) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
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
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
        <KelolaEmpty
          icon={Lock}
          title="Khusus pengelola"
          body="Konsol ini hanya untuk instruktur atau owner komunitas."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 sm:p-8">
      <header className="space-y-2">
        <span className="eyebrow">Konsol pengelola · {tenant.name}</span>
        <h1 className="text-3xl sm:text-4xl">
          Kelola <em className="italic text-primary">komunitas</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Atur kelas, kuis, profil komunitas, dan pengumuman dari satu tempat.
        </p>
      </header>

      <div role="tablist" aria-label="Menu kelola" className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0">
        {tab === "kelas" ? <KelolaKelasTab tenantId={tenant._id} /> : null}
        {tab === "kuis" ? <KelolaKuisTab tenantId={tenant._id} /> : null}
        {tab === "komunitas" ? <TenantSettingsView slug={tenant.slug} /> : null}
        {tab === "pengumuman" ? (
          <AnnouncementsView tenantId={tenant._id} canManage />
        ) : null}
      </div>
    </div>
  );
}
