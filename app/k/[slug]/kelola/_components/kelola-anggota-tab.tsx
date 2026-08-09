"use client";

// Kelola › Anggota & peran — the roster with the owner's role control. The OS
// console reached this only through the community home page (TenantHomeView
// mounted MembersList as a side-effect of the profile card); as a console tab
// it is a first-class surface. MembersList owns the read and the rendering;
// this wires the two seams the slice deliberately does not fetch itself: the
// viewer's own id (so their row stays read-only) and the role mutation.
import type { Id } from "@convex/_generated/dataModel";
import { MembersList, useMyMembership, useSetMemberRole } from "@/features/tenants";
import { useCurrentProfile } from "@/features/profiles";

export function KelolaAnggotaTab({ tenantId }: { tenantId: Id<"tenants"> }) {
  const { profile } = useCurrentProfile();
  const { membership } = useMyMembership(tenantId);
  const [setRole, { isPending }] = useSetMemberRole();

  return (
    <MembersList
      tenantId={tenantId}
      // Owner-only, mirroring the server gate: an instructor can reach this
      // console but cannot promote anyone.
      canManageRoles={membership?.role === "owner"}
      currentUserId={profile?.userId}
      isSettingRole={isPending}
      onSetRole={(targetUserId, role) => void setRole({ tenantId, targetUserId, role })}
    />
  );
}
