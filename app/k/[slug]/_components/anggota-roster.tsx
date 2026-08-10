"use client";

// Member roster — an iOS inset grouped list (see ./inset-list.tsx).
//
// NOT <MembersList/> from the tenants barrel: that component self-fetches and
// exposes no filter, no row href and no join date, and slices/ is out of scope
// for this change. This keeps its contract intact — same useTenantMembers read,
// same RoleChip, same owner-only role control wired to useSetMemberRole — and
// adds the three things the tab needs. Fold it back into MembersList (props:
// `query`, `memberHref`, `showSince`) the next time that file is touched.
import { useMemo, useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { CommandSearch } from "@/components/mockup-kit";
import { useMyMembership, useSetMemberRole, useTenantMembers } from "@/features/tenants";
import { useCurrentProfile } from "@/features/profiles";
import { communityHref } from "@/lib/community";
import { AnggotaMemberRow } from "./anggota-member-row";
import { GabungDulu } from "./gabung-dulu";
import { InsetList } from "./inset-list";

// Below this the search field is pure chrome: a 46px control plus its gap, in
// front of a list you can read in one glance. It appears when the roster is
// actually long enough to lose someone in.
const SEARCH_FROM = 10;

export function AnggotaRoster({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const { profile } = useCurrentProfile();
  const members = useTenantMembers(tenantId);
  const [setRole, { isPending: isSettingRole }] = useSetMemberRole();
  const [query, setQuery] = useState("");

  // Client-side filter: listMembers is capped server-side (membersPageMax), so
  // the loaded roster is the whole roster for any realistic community.
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      members?.filter((m) =>
        `${m.displayName ?? ""} ${m.username ?? ""}`.toLowerCase().includes(q)
      ),
    [members, q]
  );

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return (
      <div className="space-y-2" aria-busy>
        <span className="sr-only">Memuat anggota…</span>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || membership === null) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.anggota(slug)}
        description="Daftar anggota komunitas hanya terbuka untuk sesama anggota."
      />
    );
  }

  const canManageRoles = membership?.role === "owner";

  // No SectionHeader. The bottom tab bar and the desktop tab strip both already
  // read "Anggota", and an eyebrow + title + hairline in front of an obvious
  // list of people is 70px spent restating the navigation. The member count
  // survives as the group caption, where iOS puts it.
  if (members === undefined) {
    return (
      <div className="space-y-2" aria-busy>
        <span className="sr-only">Memuat anggota…</span>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada anggota.</p>;
  }

  return (
    <div className="space-y-3">
      {members.length >= SEARCH_FROM ? (
        <CommandSearch value={query} onChange={setQuery} placeholder="Cari anggota…" />
      ) : null}
      {visible && visible.length === 0 ? (
        <p className="border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Tidak ada anggota yang cocok dengan “{query}”.
        </p>
      ) : (
        <InsetList caption={`${members.length} anggota`}>
          {visible?.map((m) => (
            <AnggotaMemberRow
              key={m.userId}
              member={m}
              // Owner rows and the viewer's own row stay read-only — mirrors the
              // server gates (owner untouchable, no self-change).
              canEdit={canManageRoles && m.role !== "owner" && m.userId !== profile?.userId}
              isSettingRole={isSettingRole}
              onSetRole={(targetUserId, role) => setRole({ tenantId, targetUserId, role })}
            />
          ))}
        </InsetList>
      )}
    </div>
  );
}
