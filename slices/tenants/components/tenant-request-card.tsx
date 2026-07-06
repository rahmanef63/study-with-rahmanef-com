"use client";

// tenants slice — one pending-request row in the admin queue (presentational;
// the queue view owns the confirm dialog + mutations).
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { PendingTenantRequest, TenantLabels } from "../types";

export type TenantRequestCardProps = {
  request: PendingTenantRequest;
  labels?: Partial<TenantLabels["adminQueue"]>;
  disabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function TenantRequestCard({
  request,
  labels,
  disabled,
  onApprove,
  onReject,
}: TenantRequestCardProps) {
  const t = { ...DEFAULT_TENANT_LABELS.adminQueue, ...labels };
  const owner = request.owner.displayName ?? request.owner.username ?? t.unknownOwner;
  const meta = `/t/${request.slug}${request.track ? ` · ${request.track}` : ""}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{request.name}</CardTitle>
        <CardDescription>{meta}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-foreground text-sm">{request.description}</p>
        {request.requestMessage ? (
          <p className="text-muted-foreground text-sm">
            <span className="font-medium">{t.messageLabel}:</span> {request.requestMessage}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {t.ownerLabel}: {owner}
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled={disabled} onClick={onApprove}>
            {t.approve}
          </Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={onReject}>
            {t.reject}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
