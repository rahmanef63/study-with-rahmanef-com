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
import { tenantsApi, useMyMembership, type PublicTenant } from "@/features/tenants";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

type ResourcesPayload = { tenantSlug: string; view?: "board" | "usulan" };

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
  const payload = props.payload as ResourcesPayload | undefined;
  const slug = payload?.tenantSlug;

  // Public tenant lookup by slug (same query the routes' useTenantBySlug wraps).
  // `undefined` = loading, `null` = not found/inactive. Skip when no slug.
  const tenant = useQuery(
    tenantsApi.getPublicBySlug,
    slug ? { slug } : "skip",
  ) as PublicTenant | null | undefined;

  // Membership → canModerate exactly like the routes: instructor+ is a UX gate;
  // every Convex function re-checks the role server-side. The hook skips until
  // authenticated so it never throws during the auth handshake.
  const { membership } = useMyMembership(tenant?._id);
  const canModerate = membership?.role === "instructor" || membership?.role === "owner";

  const [tab, setTab] = useState<TabKey>(payload?.view === "usulan" ? "usulan" : "board");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6 sm:p-8">
      <header className="space-y-2">
        <span className="eyebrow">Sumber &amp; usulan · Komunitas</span>
        <h1 className="text-3xl sm:text-4xl">
          Papan sumber <em className="italic text-primary">komunitas</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Kurasi tautan bermanfaat dan usulkan topik berikutnya — pilih tab di bawah.
        </p>
      </header>

      {!slug ? (
        <ResourcesEmpty
          title="Komunitas belum dipilih"
          description="Buka papan ini dari sebuah komunitas untuk melihat sumber dan usulannya."
        />
      ) : tenant === undefined ? (
        <div className="space-y-4">
          <div className="h-11 w-64 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      ) : tenant === null ? (
        <ResourcesEmpty
          title="Komunitas tidak ditemukan"
          description="Komunitas ini tidak aktif atau tautannya sudah tidak berlaku."
        />
      ) : (
        <div className="space-y-8">
          <div role="tablist" aria-label="Papan sumber atau kotak usulan" className="flex gap-1 border-b">
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
                    "-mb-px min-h-11 min-w-0 truncate border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
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
