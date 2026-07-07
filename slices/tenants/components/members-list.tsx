"use client";

// tenants slice — member roster (member-only read; the query enforces authz).
// An owner viewing the roster gets a per-row role control (member↔instructor);
// the server re-checks every gate, so the UI guards (hide owner rows + the self
// row) are pure UX. Read-only for everyone else.
import { ChevronDown } from "lucide-react";
import { SectionHeader, Badge } from "@/components/mockup-kit";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useTenantMembers } from "../hooks/use-tenant-queries";
import type { TenantLabels, TenantMember } from "../types";
import { RoleChip } from "./role-chip";

/** Roles an owner can assign through this control (owner is never assignable). */
type AssignableRole = "member" | "instructor";

export type MembersListProps = {
  tenantId: Id<"tenants">;
  limit?: number;
  labels?: Partial<TenantLabels["members"]>;
  roleLabels?: TenantLabels["roles"];
  className?: string;
  /** True only when the viewer is the tenant owner — enables the role control. */
  canManageRoles?: boolean;
  /** The viewer's own user id, so their own row stays read-only (no self-change). */
  currentUserId?: Id<"users">;
  /** Disables the control while a role change is in flight. */
  isSettingRole?: boolean;
  onSetRole?: (targetUserId: Id<"users">, role: AssignableRole) => void;
};

function MemberRow({
  member,
  roleLabels,
  canManageRoles,
  currentUserId,
  isSettingRole,
  onSetRole,
}: {
  member: TenantMember;
  roleLabels?: TenantLabels["roles"];
  canManageRoles?: boolean;
  currentUserId?: Id<"users">;
  isSettingRole?: boolean;
  onSetRole?: (targetUserId: Id<"users">, role: AssignableRole) => void;
}) {
  const name = member.displayName ?? member.username ?? "Anggota";
  // Owner rows and the viewer's own row are never editable — mirrors the server
  // gates (owner untouchable, no self-change), and onSetRole may be absent.
  const canEdit =
    !!canManageRoles &&
    !!onSetRole &&
    member.role !== "owner" &&
    member.userId !== currentUserId;

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
      {canEdit ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isSettingRole}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label={`Ubah role ${name}`}
          >
            <RoleChip role={member.role} labels={roleLabels} />
            <ChevronDown className="text-muted-foreground size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={member.role}
              onValueChange={(v) => onSetRole?.(member.userId, v as AssignableRole)}
            >
              <DropdownMenuRadioItem value="member">
                {roleLabels?.member ?? "Member"}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="instructor">
                {roleLabels?.instructor ?? "Instructor"}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <RoleChip role={member.role} labels={roleLabels} />
      )}
    </li>
  );
}

export function MembersList({
  tenantId,
  limit,
  labels,
  roleLabels,
  className,
  canManageRoles,
  currentUserId,
  isSettingRole,
  onSetRole,
}: MembersListProps) {
  const t = { ...DEFAULT_TENANT_LABELS.members, ...labels };
  const members = useTenantMembers(tenantId, limit);

  return (
    <section className={className}>
      <SectionHeader
        eyebrow="Komunitas"
        title={t.title}
        actions={
          members && members.length > 0 ? (
            <Badge tone="muted">{members.length} anggota</Badge>
          ) : undefined
        }
      />
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
            <MemberRow
              key={m.userId}
              member={m}
              roleLabels={roleLabels}
              canManageRoles={canManageRoles}
              currentUserId={currentUserId}
              isSettingRole={isSettingRole}
              onSetRole={onSetRole}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
