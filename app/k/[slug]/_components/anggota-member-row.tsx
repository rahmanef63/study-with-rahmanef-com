"use client";

// One roster row: identity → public profile, join month, role. The owner-only
// role control is the same member↔instructor pair the tenants slice ships (owner
// is never assignable, and the server re-checks every change).
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleChip, type TenantMember } from "@/features/tenants";
import { communityHref } from "@/lib/community";

export type AssignableRole = "member" | "instructor";

const joinedLabel = (since: number) =>
  new Date(since).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

export function AnggotaMemberRow({
  member,
  canEdit,
  isSettingRole,
  onSetRole,
}: {
  member: TenantMember;
  canEdit: boolean;
  isSettingRole: boolean;
  onSetRole: (targetUserId: Id<"users">, role: AssignableRole) => void;
}) {
  const name = member.displayName ?? member.username ?? "Anggota";
  const identity = (
    <>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {member.username ? `@${member.username} · ` : ""}bergabung {joinedLabel(member.since)}
        </span>
      </span>
    </>
  );

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      {/* No username = no public profile yet (profiles are created on first
          login), so that row stays non-interactive rather than 404ing. */}
      {member.username ? (
        <Link
          href={communityHref.profile(member.username)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {identity}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
      )}
      {canEdit ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isSettingRole}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label={`Ubah role ${name}`}
          >
            <RoleChip role={member.role} />
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={member.role}
              onValueChange={(v) => onSetRole(member.userId, v as AssignableRole)}
            >
              <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="instructor">Instructor</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <RoleChip role={member.role} className="shrink-0" />
      )}
    </li>
  );
}
