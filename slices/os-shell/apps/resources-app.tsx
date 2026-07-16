"use client";
// Resources — the OS "papan sumber" app: a community's curated resource board
// plus its suggestion box ("usulan"), the two former /t/[slug]/resources and
// /t/[slug]/usulan routes folded into ONE window with an in-window tab switch.
// Renders inside an appshell window, so it fetches client-side via useQuery
// (root layout already mounts Convex), mirroring beranda-app conventions.
import { useState } from "react";
import { useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import { ResourceBoardView, SuggestionBoxView } from "@/features/resources";
import { openApp, seg } from "./_nav";
import { tenantsApi, useMyMembership, type PublicTenant } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Hero } from "@/components/mockup-kit";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "board", label: "Papan sumber" },
  { key: "usulan", label: "Kotak usulan" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ResourcesEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle className="font-serif">{title}</EmptyTitle>
        <EmptyDescription className="text-pretty">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default function ResourcesApp(props: AppProps) {
  // Deep-link path: /resources/<tenantSlug>/<view?> (view: board | usulan)
  const [slug, view] = seg(props.payload);

  // Public tenant lookup by slug (same query the routes' useTenantBySlug wraps).
  // `undefined` = loading, `null` = not found/inactive. Skip when no slug.
  const tenant = useQuery(
    tenantsApi.getPublicBySlug,
    slug ? { slug } : "skip",
  ) as PublicTenant | null | undefined;

  // Membership → canModerate exactly like the routes: instructor+ is a UX gate;
  // every Convex function re-checks the role server-side. The hook skips until
  // authenticated so it never throws during the auth handshake.
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenant?._id);
  const canModerate = membership?.role === "instructor" || membership?.role === "owner";

  const [tab, setTab] = useState<TabKey>(view === "usulan" ? "usulan" : "board");

  // Anon login-gate (#27, zeta e2e spec 9): every read in BOTH tabs is
  // member-only server-side (requireTenantRole) — without this branch the
  // first query throws NOT_AUTHENTICATED through convex/react into
  // app/error.tsx and kills the whole desktop. Pattern: kelola-app.
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="w-full space-y-8 p-6 @sm:p-8">
        <Hero
          eyebrow="Sumber & usulan · Komunitas"
          title={
            <>
              Papan sumber <em className="italic text-primary">komunitas</em>.
            </>
          }
          description="Kurasi tautan bermanfaat dan usulkan topik berikutnya."
        />
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle className="font-serif">Masuk untuk membuka sumber &amp; usulan</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Papan sumber dan kotak usulan hanya untuk anggota komunitas. Masuk dulu, ya.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
            <LogIn aria-hidden className="size-4" /> Masuk
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 p-6 @sm:p-8">
      <Hero
        eyebrow="Sumber & usulan · Komunitas"
        title={
          <>
            Papan sumber <em className="italic text-primary">komunitas</em>.
          </>
        }
        description="Kurasi tautan bermanfaat dan usulkan topik berikutnya — pilih tab di bawah."
      />

      {!slug ? (
        <ResourcesEmpty
          title="Komunitas belum dipilih"
          description="Buka papan ini dari sebuah komunitas untuk melihat sumber dan usulannya."
        />
      ) : tenant === undefined ? (
        <div className="space-y-4">
          <div className="h-10 w-64 max-w-full animate-pulse rounded-full bg-muted/50" />
          <div className="h-64 animate-pulse rounded-[var(--radius-win)] bg-muted/50" />
        </div>
      ) : tenant === null ? (
        <ResourcesEmpty
          title="Komunitas tidak ditemukan"
          description="Komunitas ini tidak aktif atau tautannya sudah tidak berlaku."
        />
      ) : (
        <div className="space-y-8">
          <div
            role="tablist"
            aria-label="Papan sumber atau kotak usulan"
            className="flex flex-wrap gap-2"
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex min-h-11 min-w-0 items-center justify-center truncate rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "board" ? (
            <ResourceBoardView tenantId={tenant._id} canModerate={canModerate} />
          ) : (
            <SuggestionBoxView tenantId={tenant._id} canModerate={canModerate} />
          )}
        </div>
      )}
    </div>
  );
}
