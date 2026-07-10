"use client";
// comments slice — reactive read hook (rr "Data fetching": useQuery from
// convex/react; never fetch in useEffect). Returns undefined while loading.
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LessonCommentsResult } from "../types";

export function useLessonComments(
  lessonId: Id<"lessons">
): LessonCommentsResult | undefined {
  return useQuery(api.features.comments.queries.listByLesson, { lessonId });
}
