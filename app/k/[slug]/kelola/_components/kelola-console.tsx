"use client";

// The instructor console. ONE surface with local-state tabs, not six routes:
// an instructor building a course jumps between kelas ⇄ kuis ⇄ statistik
// constantly, and a route per tab would reload the whole community shell each
// time. Every tab mounts the real management view from a slice barrel — no CRUD
// is reimplemented here.
//
// Gating below is UX only; the server authz on each Convex function is the real
// guard. Membership can only be resolved in the browser (server components here
// are permanently anonymous), which is why the whole console is a client island.
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ListChecks,
  Lock,
  Sparkles,
  Users,
  IdCard,
  type LucideIcon,
} from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { TenantSettingsView, useMyMembership } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/mockup-kit";
import { communityHref } from "@/lib/community";
import { KelolaEmpty, KelolaSkeleton } from "./kelola-parts";
import { KelolaAnggotaTab } from "./kelola-anggota-tab";
import { KelolaKelasTab } from "./kelola-kelas-tab";
import { KelolaKuisTab } from "./kelola-kuis-tab";
import { KelolaSkillsTab } from "./kelola-skills-tab";
import { KelolaStatistikTab } from "./kelola-statistik-tab";

// "pengumuman" is gone (v1.8 #33): an announcement is now a `posts` row with
// kind "pengumuman", written from the Diskusi composer (instructor+ only) and
// pinned there — a dedicated console tab for one post kind was the "ribet".
type TabKey = "kelas" | "skills" | "kuis" | "anggota" | "komunitas" | "statistik";

const TABS: { key: TabKey; label: string; icon: LucideIcon; blurb: string }[] = [
  // A kelas is a playlist of materi the community already owns (DECISIONS #37),
  // so the blurb promises curating, not authoring a tree.
  { key: "kelas", label: "Kelas", icon: BookOpen, blurb: "Susun kelas dari materi komunitas." },
  // Skills gets its OWN tab rather than a filter inside Kelas: a skill is a
  // materi row (kind: "skill"), but authoring one is a different job — you
  // write a prompt, not a lesson plan — and burying it would leave an author
  // guessing which library their writing lands in.
  {
    key: "skills",
    label: "Skills",
    icon: Sparkles,
    blurb: "Tulis prompt siap pakai untuk perpustakaan skill.",
  },
  { key: "kuis", label: "Kuis", icon: ListChecks, blurb: "Bangun bank soal per kelas." },
  { key: "anggota", label: "Anggota & peran", icon: Users, blurb: "Lihat anggota, atur perannya." },
  {
    key: "komunitas",
    label: "Profil komunitas",
    icon: IdCard,
    blurb: "Atur nama, deskripsi, dan identitas komunitas.",
  },
  {
    key: "statistik",
    label: "Statistik",
    icon: BarChart3,
    blurb: "Progres per materi & hasil kuis.",
  },
];

export function KelolaConsole({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const [tab, setTab] = useState<TabKey>("kelas");

  // While logged OUT the membership query is skipped, so `membership` never
  // resolves — without this branch the console would spin forever.
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <KelolaEmpty
        icon={Lock}
        title="Masuk untuk mengelola"
        body="Konsol pengelola butuh login."
        action={
          <Button asChild className="min-h-11">
            <Link href={`/masuk?next=${encodeURIComponent(communityHref.kelola(slug))}`}>
              Masuk
            </Link>
          </Button>
        }
      />
    );
  }

  if (isAuthLoading || membership === undefined) return <KelolaSkeleton lines={4} />;

  const canManage = membership?.role === "instructor" || membership?.role === "owner";
  if (!canManage) {
    return (
      <KelolaEmpty
        icon={Lock}
        title="Khusus pengajar"
        body="Konsol ini hanya untuk instruktur atau owner komunitas."
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href={communityHref.home(slug)}>Kembali ke komunitas</Link>
          </Button>
        }
      />
    );
  }

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  return (
    <div className="space-y-6">
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
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

      {/* The "Pengumuman" tab used to be here. Dropping it silently would leave
          an instructor hunting for a console screen that no longer exists, so
          the console says where the capability went — once, quietly. */}
      <p className="text-xs text-muted-foreground">
        Mau kirim pengumuman?{" "}
        <Link
          href={communityHref.diskusiKind(slug, "pengumuman")}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Tulis di Diskusi
        </Link>{" "}
        lalu pilih kategori <strong className="font-medium">Pengumuman</strong>. Sematkan
        posnya kalau mau tampil paling atas.
      </p>

      <section className="min-w-0 space-y-5">
        <SectionHeader
          title={active.label}
          as="h3"
          actions={
            <span className="hidden max-w-xs truncate text-sm text-muted-foreground @md:block">
              {active.blurb}
            </span>
          }
        />
        <div className="min-w-0">
          {tab === "kelas" ? <KelolaKelasTab tenantId={tenantId} /> : null}
          {tab === "skills" ? <KelolaSkillsTab tenantId={tenantId} slug={slug} /> : null}
          {tab === "kuis" ? <KelolaKuisTab tenantId={tenantId} /> : null}
          {tab === "anggota" ? <KelolaAnggotaTab tenantId={tenantId} /> : null}
          {tab === "komunitas" ? <TenantSettingsView slug={slug} /> : null}
          {tab === "statistik" ? <KelolaStatistikTab tenantId={tenantId} /> : null}
        </div>
      </section>
    </div>
  );
}
