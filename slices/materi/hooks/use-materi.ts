"use client";
// materi slice — the single-materi reads.
//
// `getBySlug` authorizes on the MATERI'S tenant and the MATERI'S status; no
// course is consulted, which is the whole point of the model. It THROWS
// NOT_FOUND for an unknown slug, a deleted row, and a draft below instructor
// level — indistinguishable on purpose, so a stranger cannot use the response
// as an existence oracle. convex/react surfaces a query error by throwing
// during render, so any consumer must sit inside <MateriErrorBoundary/>.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { MateriBacklinks, MateriDetail } from "../types";

/**
 * MEMBER+. The whole materi page. Skipped while `enabled` is false — the
 * caller flips it on only once it knows the viewer is a member, otherwise the
 * gate would never get a chance to render.
 */
export function useMateri(
  tenantSlug: string,
  lessonSlug: string,
  enabled: boolean
): MateriDetail | undefined {
  return useQuery(
    api.features.materi.queries.getBySlug,
    enabled ? { tenantSlug, lessonSlug } : "skip"
  );
}

/**
 * MEMBER+. "Muncul di" for one materi: the courses that teach it and the
 * materi pages that reference it.
 *
 * Split out from `useMateri` even though `getBySlug` already returns both — a
 * panel that can refresh without refetching the body is the reason the server
 * exposes it separately, and the detail view uses THIS for the section below
 * the body so a placement change does not re-render the markdown.
 */
export function useMateriBacklinks(
  lessonId: Id<"lessons"> | undefined,
  enabled: boolean
): MateriBacklinks | undefined {
  return useQuery(
    api.features.materi.queries.backlinksFor,
    enabled && lessonId !== undefined ? { lessonId } : "skip"
  );
}
