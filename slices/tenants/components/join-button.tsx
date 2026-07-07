"use client";

// tenants slice — join flow CTA (R3). Three states: logged out → login link;
// member → role chip; logged in non-member → join mutation.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useMyMembership } from "../hooks/use-tenant-queries";
import { useJoinTenant } from "../hooks/use-tenant-mutations";
import type { TenantLabels } from "../types";
import { RoleChip } from "./role-chip";

export type JoinButtonProps = {
  tenantId: Id<"tenants">;
  /** Where the login CTA points; consumer-routed. */
  loginHref?: string;
  labels?: Partial<TenantLabels["join"]>;
  roleLabels?: TenantLabels["roles"];
  className?: string;
};

export function JoinButton({
  tenantId,
  loginHref = "/masuk",
  labels,
  roleLabels,
  className,
}: JoinButtonProps) {
  const t = { ...DEFAULT_TENANT_LABELS.join, ...labels };
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const [join, { isPending }] = useJoinTenant({ success: t.success });

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <Skeleton className={className ?? "h-9 w-36"} />;
  }

  if (!isAuthenticated) {
    return (
      <Button asChild className={cn("min-h-11 sm:min-h-9", className)}>
        <Link href={loginHref}>{t.loginFirst}</Link>
      </Button>
    );
  }

  if (membership) {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <span className="text-muted-foreground mr-2 text-sm">{t.alreadyMember}</span>
        <RoleChip role={membership.role} labels={roleLabels} />
      </div>
    );
  }

  return (
    <Button
      className={cn("min-h-11 sm:min-h-9", className)}
      disabled={isPending}
      onClick={() => void join({ tenantId })}
    >
      {isPending ? t.pending : t.cta}
    </Button>
  );
}
