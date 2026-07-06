"use client";
// progress slice — reactive "is this lesson done?" read for the lesson player.
// Skipped until a lessonId is known; `undefined` while loading. Cast note: see
// use-course-progress.ts (api.d.ts untyped until codegen).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { LessonCompletionData } from "../types";

export function useLessonCompletion(lessonId: Id<"lessons"> | undefined) {
  return useQuery(
    api.features.progress.queries.getLessonCompletion,
    lessonId === undefined ? "skip" : { lessonId }
  ) as LessonCompletionData | undefined;
}
