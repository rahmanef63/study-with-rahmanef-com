"use client";

// tenants slice — `/t/[slug]` community home (R3). Self-fetching client view;
// the integrator mounts it inside the route and composes course content below
// (via the `children` slot — course list belongs to the courses slice).
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { useMyMembership, useTenantBySlug } from "../hooks/use-tenant-queries";
import { useSetMemberRole } from "../hooks/use-tenant-mutations";
import type { TenantLabels } from "../types";
import { JoinButton } from "./join-button";
import { MembersList } from "./members-list";
import { TenantProfileCard } from "./tenant-profile-card";
import { TenantCoverEditor } from "./tenant-cover-editor";

export type TenantHomeViewProps = {
  slug: string;
  loginHref?: string;
  homeHref?: string;
  showMembers?: boolean;
  /** The viewer's own user id. When set AND the viewer is the owner, the roster
   *  gains a per-member role control (member↔instructor); omit for read-only. */
  currentUserId?: Id<"users">;
  labels?: {
    home?: Partial<TenantLabels["home"]>;
    join?: Partial<TenantLabels["join"]>;
    members?: Partial<TenantLabels["members"]>;
    roles?: TenantLabels["roles"];
  };
  /** Rendered below the profile (e.g. the courses slice etalase). */
  children?: ReactNode;
  className?: string;
};

export function TenantHomeView({
  slug,
  loginHref,
  homeHref = "/",
  showMembers = true,
  currentUserId,
  labels,
  children,
  className,
}: TenantHomeViewProps) {
  const t = { ...DEFAULT_TENANT_LABELS.home, ...labels?.home };
  const tenant = useTenantBySlug(slug);
  const { membership } = useMyMembership(tenant?._id);
  const [setRole, { isPending: isSettingRole }] = useSetMemberRole();
  const canManageRoles = membership?.role === "owner";

  if (tenant === undefined) {
    return (
      <div className={className}>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (tenant === null) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>{t.notFoundTitle}</EmptyTitle>
          <EmptyDescription>{t.notFoundBody}</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" asChild>
          <Link href={homeHref}>{t.backToHome}</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className={className ?? "flex flex-col gap-6"}>
      <TenantProfileCard
        tenant={tenant}
        labels={labels?.home}
        coverAction={
          canManageRoles ? (
            <TenantCoverEditor tenantId={tenant._id} currentUrl={tenant.coverImageUrl} />
          ) : undefined
        }
        actions={
          <JoinButton
            tenantId={tenant._id}
            loginHref={loginHref}
            labels={labels?.join}
            roleLabels={labels?.roles}
          />
        }
      />
      {children}
      {showMembers && membership ? (
        <MembersList
          tenantId={tenant._id}
          labels={labels?.members}
          roleLabels={labels?.roles}
          canManageRoles={canManageRoles}
          currentUserId={currentUserId}
          isSettingRole={isSettingRole}
          onSetRole={(targetUserId, role) => setRole({ tenantId: tenant._id, targetUserId, role })}
        />
      ) : null}
    </div>
  );
}
