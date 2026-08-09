"use client";
// Admin — platform-admin console (super admin only). Wraps the EXISTING admin
// view (community approval queue) in one OS window. Triple-
// gated: every underlying query is requirePlatformAdmin (server, the real guard),
// this app shows a "khusus admin" state for non-admins, and os-root hides the app
// from the registry entirely unless the caller is a platform admin.
import { type AppProps } from "@/features/appshell";
import { AdminTenantQueueView, useMyPlatformAdmin } from "@/features/tenants";
import { Hero } from "@/components/mockup-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function AdminApp(_props: AppProps) {
  const admin = useMyPlatformAdmin();

  return (
    <div className="w-full space-y-8 p-6 @md:p-8">
      <Hero
        eyebrow="Platform"
        title="Admin"
        description="Moderasi komunitas — khusus admin."
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
          <AdminTenantQueueView />
        )}
      </div>
    </div>
  );
}
