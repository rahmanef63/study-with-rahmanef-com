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
        <CardTitle className="font-serif text-lg">{request.name}</CardTitle>
        <CardDescription className="break-words">{meta}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-foreground text-pretty text-sm">{request.description}</p>
        {request.requestMessage ? (
          <p className="text-muted-foreground text-pretty text-sm">
            <span className="font-medium">{t.messageLabel}:</span> {request.requestMessage}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {t.ownerLabel}: {owner}
        </p>
        <div className="flex flex-col gap-2 pt-1 @sm:flex-row">
          <Button
            className="min-h-11 flex-1 @sm:min-h-9 @sm:flex-none"
            disabled={disabled}
            onClick={onApprove}
          >
            {t.approve}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 flex-1 @sm:min-h-9 @sm:flex-none"
            disabled={disabled}
            onClick={onReject}
          >
            {t.reject}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
