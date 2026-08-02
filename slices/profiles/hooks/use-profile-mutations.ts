"use client";

// Slice-local mutation hooks (rr "data fetching": mutations go through
// slice hooks, never inline in JSX; ConvexError.code → user copy → sonner).
import { useConvex, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import { DEFAULT_PROFILE_LABELS } from "../config/labels";
import { PROFILE_ERROR_CODES } from "../types";
import type {
  CurrentProfile,
  ProfileErrorCode,
  ProfileFormValues,
  ProfileLabels,
  UsernameCheck,
} from "../types";

/** Typed code from a ConvexError, or undefined for foreign errors. */
export function profileErrorCode(err: unknown): ProfileErrorCode | undefined {
  if (!(err instanceof ConvexError)) return undefined;
  const code = (err.data as { code?: string } | undefined)?.code;
  return PROFILE_ERROR_CODES.find((known) => known === code);
}

/** Imperative ensure-on-first-login trigger (PRD R1). Errors surface via toast. */
export function useEnsureProfile(labels?: Partial<ProfileLabels>) {
  const copy = { ...DEFAULT_PROFILE_LABELS, ...labels };
  const mutate = useMutation(api.features.profiles.mutations.ensureProfile);
  const ensureProfile = useCallback(async (): Promise<CurrentProfile | null> => {
    try {
      return (await mutate({})) as CurrentProfile;
    } catch (err) {
      const code = profileErrorCode(err);
      toast.error(code ? copy.errors[code] : copy.errorFallback);
      console.error("[profiles:ensureProfile]", code ?? "unknown");
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutate, copy.errorFallback]);
  return { ensureProfile };
}

/**
 * Fire ensureProfile exactly once when `enabled` first becomes true (signed-in
 * user with no profile row). This is a one-shot WRITE bootstrap, not a read —
 * the "never fetch in useEffect" rule stays intact: all reads live in
 * useCurrentProfile's useQuery, which reactively picks up the created row.
 */
export function useEnsureProfileOnFirstLogin(enabled: boolean) {
  const { ensureProfile } = useEnsureProfile();
  const fired = useRef(false);
  useEffect(() => {
    if (!enabled || fired.current) return;
    fired.current = true;
    void ensureProfile();
  }, [enabled, ensureProfile]);
}

/** Settings-form save with code→copy toast mapping. */
export function useUpdateProfile(labels?: Partial<ProfileLabels>) {
  const copy = { ...DEFAULT_PROFILE_LABELS, ...labels };
  const mutate = useMutation(api.features.profiles.mutations.updateProfile);
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (
      values: ProfileFormValues
    ): Promise<{ ok: boolean; code?: ProfileErrorCode }> => {
      setIsSaving(true);
      try {
        await mutate(values);
        toast.success(copy.saved);
        return { ok: true };
      } catch (err) {
        const code = profileErrorCode(err);
        // Server VALIDATION_FAILED messages are user-safe Bahasa copy already.
        const serverMessage =
          err instanceof ConvexError
            ? (err.data as { message?: string } | undefined)?.message
            : undefined;
        toast.error(
          code === "VALIDATION_FAILED" && serverMessage
            ? serverMessage
            : code
              ? copy.errors[code]
              : copy.errorFallback
        );
        console.error("[profiles:updateProfile]", code ?? "unknown");
        return { ok: false, code };
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, copy.saved, copy.errorFallback]
  );

  return { save, isSaving };
}

/** Imperative availability probe for the username field (on blur). */
export function useCheckUsername() {
  const convex = useConvex();
  return useCallback(
    async (username: string): Promise<UsernameCheck | null> => {
      try {
        return (await convex.query(
          api.features.profiles.queries.checkUsername,
          { username }
        )) as UsernameCheck;
      } catch {
        return null; // probe is best-effort UX; save still validates on server
      }
    },
    [convex]
  );
}
