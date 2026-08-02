// roadmap slice — public types for the CourseNav rail: a course's modules→lessons
// + per-lesson completion status (derived, no new data).
import type { Id } from "@convex/_generated/dataModel";

export type RoadmapNodeStatus = "done" | "next" | "available" | "locked";

/** One lesson rendered as a step on the path. */
export type RoadmapLesson = {
  id: Id<"lessons">;
  title: string;
  hasVideo: boolean;
  status: RoadmapNodeStatus;
};

/** A module = a labelled section of the path. */
export type RoadmapModule = {
  id: Id<"modules">;
  title: string;
  lessons: RoadmapLesson[];
  doneCount: number;
  total: number;
};
