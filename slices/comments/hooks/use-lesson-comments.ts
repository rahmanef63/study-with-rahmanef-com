"use client";
// comments slice — reactive read hooks (rr "Data fetching": useQuery from
// convex/react; never fetch in useEffect). Returns undefined while loading.
//
// Two targets since v1.8 #29 — a lesson OR a Diskusi post. Both queries are
// MEMBER-gated, so each is SKIPPED when its id is absent: calling one with a
// missing target would throw into the error boundary instead of letting the
// consumer render its join CTA.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LessonCommentsResult } from "../types";

export function useLessonComments(
  lessonId: Id<"lessons"> | undefined
): LessonCommentsResult | undefined {
  return useQuery(
    api.features.comments.queries.listByLesson,
    lessonId ? { lessonId } : "skip"
  );
}

/** Same projection, same placeholder contract — only the index differs (by_post). */
export function usePostComments(
  postId: Id<"posts"> | undefined
): LessonCommentsResult | undefined {
  return useQuery(
    api.features.comments.queries.listByPost,
    postId ? { postId } : "skip"
  );
}
