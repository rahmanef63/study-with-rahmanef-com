"use client";
// analytics slice — the ONE write in this slice: "a member opened this materi".
// Renders nothing. Mount it wherever a materi is actually READ.
//
// WHY A COMPONENT AND NOT A CALL. Three surfaces read a materi (the materi
// permalink, the skill permalink, the in-course reader) and every one of them
// would otherwise repeat the same four decisions — once per mount, only for
// members, off the render path, failures swallowed. One of those getting it
// wrong is a silently wrong funnel, which is worse than no funnel.
//
// THE FOUR RULES, and how each is enforced:
//
// 1. ONCE PER VIEW. `useEffect` + a ref keyed on the lessonId. React 19
//    re-invokes effects in dev StrictMode and the router remounts on every
//    navigation, so the ref is the client-side guard — and `recordView` is
//    idempotent per member per materi per WIB day on top of it, so even a
//    refresh loop cannot move a number.
//
// 2. NEVER ON HOVER OR PREFETCH. A Next `<Link>` prefetch fetches the RSC
//    payload; it does not mount components and it does not run effects. Putting
//    the call in `useEffect` is therefore what makes it structurally impossible
//    to count a hover — not a debounce, not a timer.
//
// 3. NEVER BLOCKS RENDER. Fire-and-forget: the promise is dropped, nothing
//    suspends, nothing re-renders on completion, and the component returns
//    null. A slow or failing mutation is invisible to the reader.
//
// 4. NEVER FIRES WHEN IT WOULD BE REJECTED. `recordView` is member-only, so a
//    logged-out or non-member visitor to a public permalink must not pay a
//    round trip just to be told no. `useMyMembership` gates it — and on the
//    permalink that query is already in flight for the body, so convex/react
//    dedupes it and the gate is free.
//
// Errors are swallowed on purpose (`.catch`). This number exists for the
// instructor; the reader must never see a toast, a boundary or a retry because
// analytics failed. If it is lost, it is lost.
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMyMembership } from "@/features/tenants";

export type MateriViewRecorderProps = {
  /** The materi's OWN tenant — the one whose membership authorises the write. */
  tenantId: Id<"tenants">;
  lessonId: Id<"lessons">;
};

export function MateriViewRecorder({ tenantId, lessonId }: MateriViewRecorderProps) {
  const { membership } = useMyMembership(tenantId);
  const recordView = useMutation(api.features.insight.views.recordView);
  const sentFor = useRef<string | null>(null);
  const isMember = membership != null;

  useEffect(() => {
    if (!isMember) return;
    if (sentFor.current === lessonId) return;
    sentFor.current = lessonId;
    void recordView({ lessonId }).catch(() => {
      // Deliberately silent — see the header. Let the next visit try again.
      sentFor.current = null;
    });
  }, [isMember, lessonId, recordView]);

  return null;
}
