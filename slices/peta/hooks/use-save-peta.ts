"use client";
// Mirror a finished plan into Convex — but ONLY for a visitor who is already
// signed in, and never in a way the visitor can notice.
//
// Three rules this hook exists to enforce:
//   1. NEVER a precondition. No login prompt, no gate, no spinner. A stranger
//      finishes the questionnaire and sees the plan; this hook does nothing.
//   2. NEVER blocking. The mutation is fire-and-forget and every rejection is
//      swallowed: the plan on screen is computed locally and stays correct
//      whether or not the write lands.
//   3. Never twice for the same plan. The payload signature guards it, so
//      re-renders, tab focus and a Convex reconnect do not re-write the row.
import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PetaAnswers, PetaResult } from "@/lib/peta";
import { toProfilePayload } from "../lib/profile";

/**
 * Persist the caller's own result. No-op while logged out.
 * `tenantId` is provenance only — the community the top path belongs to.
 */
export function useSavePeta(
  answers: PetaAnswers | null,
  result: PetaResult | null,
  tenantId: Id<"tenants"> | undefined
): void {
  const { isAuthenticated } = useConvexAuth();
  const saveProfile = useMutation(api.features.insight.profiles.saveProfile);
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || answers === null || result === null) return;
    const payload = toProfilePayload(answers, result);
    const signature = JSON.stringify(payload);
    if (sent.current === signature) return;
    sent.current = signature;
    void saveProfile({ ...payload, tenantId }).catch(() => {
      // Offline, rate-limited, or a validator we did not anticipate. Allow a
      // later render to retry, and say nothing: the learner did not ask for
      // this write and must not be shown its failure.
      sent.current = null;
    });
  }, [answers, isAuthenticated, result, saveProfile, tenantId]);
}

/**
 * The caller's saved plan — `undefined` while loading, `null` when they have
 * none (or are logged out). Used ONLY to stop nagging someone who has already
 * taken the assessment; nothing on /mulai reads it.
 */
export function useSavedPeta(): { level: string; pathSlugs: string[] } | null | undefined {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.features.insight.profiles.myProfile, isAuthenticated ? {} : "skip");
  if (isLoading) return undefined;
  if (!isAuthenticated) return null;
  return profile === undefined ? undefined : profile;
}
