"use client";

// tenants slice — member roster (member-only read; the query enforces authz).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useTenantMembers } from "../hooks/use-tenant-queries";
import type { TenantLabels, TenantMember } from "../types";
import { RoleChip } from "./role-chip";

export type MembersListProps = {
  tenantId: Id<"tenants">;
  limit?: number;
  labels?: Partial<TenantLabels["members"]>;
  roleLabels?: TenantLabels["roles"];
  className?: string;
};

function MemberRow({
  member,
  roleLabels,
}: {
  member: TenantMember;
  roleLabels?: TenantLabels["roles"];
}) {
  const name = member.displayName ?? member.username ?? "Anggota";
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {member.username ? (
            <p className="text-muted-foreground truncate text-xs">@{member.username}</p>
          ) : null}
        </div>
      </div>
      <RoleChip role={member.role} labels={roleLabels} />
    </li>
  );
}

export function MembersList({
  tenantId,
  limit,
  labels,
  roleLabels,
  className,
}: MembersListProps) {
  const t = { ...DEFAULT_TENANT_LABELS.members, ...labels };
  const members = useTenantMembers(tenantId, limit);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {members === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {members.map((m) => (
              <MemberRow key={m.userId} member={m} roleLabels={roleLabels} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
