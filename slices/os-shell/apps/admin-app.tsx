"use client";
// Admin — platform-admin console (super admin only). Wraps the EXISTING admin
// views (community approval queue + cookieless traffic) in one OS window — the
// old /admin/komunitas + /admin/traffic routes, folded into the desktop. Triple-
// gated: every underlying query is requirePlatformAdmin (server, the real guard),
// this app shows a "khusus admin" state for non-admins, and os-root hides the app
// from the registry entirely unless the caller is a platform admin.
import { useState } from "react";
import { type AppProps } from "@/features/appshell";
import { AdminTenantQueueView, useMyPlatformAdmin } from "@/features/tenants";
import { TrafficView } from "@/features/pageviews";
import { Hero } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type Tab = "komunitas" | "traffic";
const TABS: { id: Tab; label: string }[] = [
  { id: "komunitas", label: "Komunitas" },
  { id: "traffic", label: "Traffic" },
];

export default function AdminApp(_props: AppProps) {
  const admin = useMyPlatformAdmin();
  const [tab, setTab] = useState<Tab>("komunitas");

  return (
    <div className="w-full space-y-8 p-6 @md:p-8">
      <Hero
        eyebrow="Platform"
        title="Admin"
        description="Moderasi komunitas & statistik platform — khusus admin."
      />

      <div className="mx-auto w-full max-w-5xl">
        {admin === undefined ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-8 w-56 max-w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : !admin.isPlatformAdmin ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle className="font-serif">Khusus admin platform</EmptyTitle>
              <EmptyDescription>Halaman ini hanya untuk admin platform.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Bagian admin"
              className="mb-6 inline-flex gap-1 rounded-lg border border-border bg-muted/40 p-1"
            >
              {TABS.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`admin-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`admin-panel-${t.id}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-auto rounded-md px-3 py-1.5 text-sm font-normal",
                    tab === t.id
                      ? "bg-background font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <div role="tabpanel" id={`admin-panel-${tab}`} aria-labelledby={`admin-tab-${tab}`}>
              {tab === "komunitas" ? <AdminTenantQueueView /> : <TrafficView />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
