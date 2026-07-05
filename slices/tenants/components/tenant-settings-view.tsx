"use client";

// tenants slice — `/t/[slug]/kelola/komunitas` owner settings (R3 kelola).
// Client-gates on the owner role for friendly UX; the real guard is the
// owner-only Convex authz on getManageView/updateProfile (route guards = UX).
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useUpdateTenantProfile } from "../hooks/use-tenant-mutations";
import { useMyMembership, useTenantBySlug, useTenantManageView } from "../hooks/use-tenant-queries";
import type { TenantLabels } from "../types";
import { TenantProfileForm } from "./tenant-profile-form";

export type TenantSettingsViewProps = {
  slug: string;
  labels?: Partial<TenantLabels["settings"]>;
  className?: string;
};

export function TenantSettingsView({ slug, labels, className }: TenantSettingsViewProps) {
  const t = { ...DEFAULT_TENANT_LABELS.settings, ...labels };
  const tenant = useTenantBySlug(slug);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenant?._id);
  const isOwner = membership?.role === "owner";
  const managed = useTenantManageView(isOwner ? tenant?._id : undefined);
  const [updateProfile, { isPending }] = useUpdateTenantProfile({ success: t.success });

  const loading =
    tenant === undefined ||
    isAuthLoading ||
    (isAuthenticated && tenant !== null && membership === undefined) ||
    (isOwner && managed === undefined);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (tenant === null || !isOwner || !managed) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>{t.loadDeniedTitle}</EmptyTitle>
          <EmptyDescription>{t.loadDeniedBody}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TenantProfileForm
          tenant={managed}
          isPending={isPending}
          labels={labels}
          onSubmit={(values) => updateProfile({ tenantId: managed._id, ...values })}
        />
      </CardContent>
    </Card>
  );
}
