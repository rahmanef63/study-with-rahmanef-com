"use client";

// /admin/traffic — cookieless visitor analytics dashboard (platform-admin).
// Client-gates on the platform-admin flag for friendly UX; the real guard is
// requirePlatformAdmin on the summary query (route guards = UX only). Mirrors
// the /admin/komunitas gate pattern (AdminTenantQueueView).
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPlatformAdmin } from "@/features/tenants";
import { TrafficView } from "@/features/pageviews";

export default function AdminTrafficPage() {
  const admin = useMyPlatformAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {admin === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-56 max-w-full rounded-md" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : admin.isPlatformAdmin ? (
        <TrafficView />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Khusus admin platform</EmptyTitle>
            <EmptyDescription>Halaman ini hanya untuk admin platform.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
