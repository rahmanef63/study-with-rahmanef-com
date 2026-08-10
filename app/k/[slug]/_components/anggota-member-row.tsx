"use client";

// One roster row in the inset grouped list: avatar → name → trailing metadata,
// the whole row tappable through to the public profile. The owner-only role
// control is the same member↔instructor pair the tenants slice ships (owner is
// never assignable, and the server re-checks every change).
//
// The role chip used to render on EVERY row, which on a normal community means
// the word "Member" repeated down the entire list — a column of noise that says
// nothing, because member IS the default. Only the exceptions (owner,
// instructor) are worth a chip now; the owner's editable rows keep theirs
// because there the chip is the control, not a label.
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar } from "@/features/profiles";
import { RoleChip, type TenantMember } from "@/features/tenants";
import { communityHref } from "@/lib/community";
import { cn } from "@/lib/utils";
import { INSET_ROW } from "./inset-list";

export type AssignableRole = "member" | "instructor";

// Short month ("Agu 2026"): the row's second line also carries @username, and
// "bergabung September 2026" is what pushed it into an ellipsis on a 360px
// screen. Nobody needs the full month name to place a join date.
const joinedLabel = (since: number) =>
  new Date(since).toLocaleDateString("id-ID", { month: "short", year: "numeric" });

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
  // Name gets the full line; @username and the role chip share the second one
  // (the same two-line shape the leaderboard row uses); the join month is
  // trailing metadata. Putting the chip on line one squeezed "Instructor"
  // against the name and truncated BOTH — and of the three, the name is the
  // one thing a roster exists to show.
  const identity = (
    <>
      <ProfileAvatar name={name} avatarUrl={member.avatarUrl} size={36} className="pixelated" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="flex min-w-0 items-center gap-1.5">
          {member.username ? (
            <span className="truncate text-xs text-muted-foreground">@{member.username}</span>
          ) : null}
          {!canEdit && member.role !== "member" ? <RoleChip role={member.role} /> : null}
        </span>
      </span>
      {/* Editable rows drop the date: the role control is already sitting in
          the trailing slot, and two things fighting for one corner is how the
          name ends up truncated to make room for a month. */}
      {canEdit ? null : (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {joinedLabel(member.since)}
        </span>
      )}
    </>
  );

  return (
    <li className="flex items-stretch">
      {/* No username = no public profile yet (profiles are created on first
          login), so that row stays non-interactive rather than 404ing. */}
      {member.username ? (
        <Link
          href={communityHref.profile(member.username)}
          className={cn(
            INSET_ROW,
            "min-w-0 flex-1 hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/40",
            canEdit && "pr-2 md:pr-2"
          )}
        >
          {identity}
          {/* iOS disclosure chevron: the row leads somewhere, and on a phone
              that has to be visible, not discovered by hovering. */}
          {canEdit ? null : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </Link>
      ) : (
        <div className={cn(INSET_ROW, "min-w-0 flex-1", canEdit && "pr-2 md:pr-2")}>{identity}</div>
      )}
      {canEdit ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isSettingRole}
            className="flex min-h-14 shrink-0 items-center gap-1 pr-5 focus-visible:outline-none focus-visible:bg-muted/40 disabled:opacity-60 md:pr-4"
            aria-label={`Ubah role ${name}`}
          >
            <RoleChip role={member.role} />
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
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
      ) : null}
    </li>
  );
}
