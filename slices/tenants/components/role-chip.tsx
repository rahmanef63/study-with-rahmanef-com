// tenants slice — tiny role indicator (no Badge primitive vendored yet).
// Theme tokens only; role→style via lookup map (no if-chains).
import { cn } from "@/lib/utils";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import type { TenantRole } from "../types";

const ROLE_STYLES: Record<TenantRole, string> = {
  owner: "bg-primary text-primary-foreground",
  instructor: "bg-secondary text-secondary-foreground",
  member: "bg-muted text-muted-foreground",
};

export function RoleChip({
  role,
  labels = DEFAULT_TENANT_LABELS.roles,
  className,
}: {
  role: TenantRole;
  labels?: Record<TenantRole, string>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ROLE_STYLES[role],
        className
      )}
    >
      {labels[role]}
    </span>
  );
}
