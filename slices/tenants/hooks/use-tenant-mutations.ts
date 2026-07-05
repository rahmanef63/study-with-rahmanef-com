"use client";

// tenants slice — mutation hooks. All client mutations go through here
// (never inline in JSX handlers); ConvexError codes map to Bahasa copy and
// surface via the shared toast (sonner).
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";
import { tenantsApi } from "../api";
import { DEFAULT_TENANT_LABELS } from "../config/labels";
import { errorToCopy } from "../lib/error-copy";
import type { ManagedTenant, TenantRole } from "../types";

type MutationState = { isPending: boolean };

function useToastedMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  successMessage?: string,
  errorLabels?: Record<string, string>
): [(args: TArgs) => Promise<TResult | null>, MutationState] {
  const [isPending, setIsPending] = useState(false);
  const run = useCallback(
    async (args: TArgs) => {
      setIsPending(true);
      try {
        const result = await fn(args);
        if (successMessage) toast.success(successMessage);
        return result;
      } catch (err) {
        toast.error(errorToCopy(err, errorLabels));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [fn, successMessage, errorLabels]
  );
  return [run, { isPending }];
}

/** Idempotent join-as-member. Resolves null on failure (already toasted). */
export function useJoinTenant(labels?: {
  success?: string;
  errors?: Record<string, string>;
}) {
  const join = useMutation(tenantsApi.join);
  return useToastedMutation<
    { tenantId: Id<"tenants"> },
    { joined: boolean; role: TenantRole }
  >(
    (args) => join(args) as Promise<{ joined: boolean; role: TenantRole }>,
    labels?.success ?? DEFAULT_TENANT_LABELS.join.success,
    labels?.errors
  );
}

/** Owner profile update. "" clears optional fields; omit = unchanged. */
export function useUpdateTenantProfile(labels?: {
  success?: string;
  errors?: Record<string, string>;
}) {
  const update = useMutation(tenantsApi.updateProfile);
  return useToastedMutation<
    {
      tenantId: Id<"tenants">;
      name?: string;
      description?: string;
      track?: string;
      discordInviteUrl?: string;
      discordWebhookUrl?: string;
    },
    ManagedTenant
  >(
    (args) => update(args) as Promise<ManagedTenant>,
    labels?.success ?? DEFAULT_TENANT_LABELS.settings.success,
    labels?.errors
  );
}

/** Owner sets member ↔ instructor (R13 data layer; UI ships in v1.1). */
export function useSetMemberRole(labels?: {
  success?: string;
  errors?: Record<string, string>;
}) {
  const setRole = useMutation(tenantsApi.setMemberRole);
  return useToastedMutation<
    {
      tenantId: Id<"tenants">;
      targetUserId: Id<"users">;
      role: Exclude<TenantRole, "owner">;
    },
    { userId: Id<"users">; role: TenantRole }
  >(
    (args) => setRole(args) as Promise<{ userId: Id<"users">; role: TenantRole }>,
    labels?.success,
    labels?.errors
  );
}
