"use client";

// tenants slice — `/admin/komunitas` platform-admin approval queue (#6, R7).
// Client-gates on the platform-admin flag for friendly UX; the real guard is
// requirePlatformAdmin on listPending/approve/reject (route guards = UX only).
import { useState } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useApproveTenant, useRejectTenant } from "../hooks/use-tenant-mutations";
import { useAdminPendingTenants, useMyPlatformAdmin } from "../hooks/use-tenant-queries";
import type { TenantLabels } from "../types";
import { TenantRequestCard } from "./tenant-request-card";
import { TenantRequestConfirmDialog } from "./tenant-request-confirm-dialog";

export type AdminTenantQueueViewProps = {
  labels?: Partial<TenantLabels["adminQueue"]>;
  className?: string;
};

type PendingAction = {
  tenantId: Id<"tenants">;
  name: string;
  kind: "approve" | "reject";
};

export function AdminTenantQueueView({ labels, className }: AdminTenantQueueViewProps) {
  const t = { ...DEFAULT_TENANT_LABELS.adminQueue, ...labels };
  const admin = useMyPlatformAdmin();
  const isAdmin = admin?.isPlatformAdmin === true;
  const pending = useAdminPendingTenants();
  const [approve, { isPending: approving }] = useApproveTenant({ success: t.approveSuccess });
  const [reject, { isPending: rejecting }] = useRejectTenant({ success: t.rejectSuccess });
  const [action, setAction] = useState<PendingAction | null>(null);
  const busy = approving || rejecting;

  if (admin === undefined || (isAdmin && pending === undefined)) {
    return (
      <div className={className}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-56 max-w-full rounded-md" />
            <Skeleton className="h-4 w-72 max-w-full rounded-md" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>{t.deniedTitle}</EmptyTitle>
          <EmptyDescription>{t.deniedBody}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const requests = pending ?? [];
  const isApprove = action?.kind === "approve";
  const runConfirm = async () => {
    if (!action) return;
    if (action.kind === "approve") await approve({ tenantId: action.tenantId });
    else await reject({ tenantId: action.tenantId });
  };

  return (
    <div className={className}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-foreground text-lg font-semibold">{t.title}</h2>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        {requests.length > 0 ? (
          <span
            className="bg-primary/10 text-primary shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium tabular-nums"
            aria-label={`${requests.length} pengajuan menunggu ditinjau`}
          >
            {requests.length}
          </span>
        ) : null}
      </div>

      {requests.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.emptyBody}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <TenantRequestCard
              key={r._id}
              request={r}
              labels={t}
              disabled={busy}
              onApprove={() => setAction({ tenantId: r._id, name: r.name, kind: "approve" })}
              onReject={() => setAction({ tenantId: r._id, name: r.name, kind: "reject" })}
            />
          ))}
        </div>
      )}

      <TenantRequestConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        title={isApprove ? t.approveConfirmTitle : t.rejectConfirmTitle}
        description={(isApprove ? t.approveConfirmBody : t.rejectConfirmBody).replace(
          "{name}",
          action?.name ?? ""
        )}
        confirmLabel={isApprove ? t.approve : t.reject}
        cancelLabel={t.cancel}
        destructive={!isApprove}
        isPending={busy}
        onConfirm={runConfirm}
      />
    </div>
  );
}
