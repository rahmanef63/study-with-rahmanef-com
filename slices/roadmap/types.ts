// roadmap slice — public types for the CourseNav rail: a course's ordered
// materi + per-materi completion status (derived, no new data).
//
// MATERI MODEL (DECISIONS #37): the course is a FLAT ordered list, so the rail
// is a flat list too. `RoadmapModule` is gone with the module tree.
import type { Id } from "@convex/_generated/dataModel";

export type RoadmapNodeStatus = "done" | "next" | "available" | "locked";

/** One materi rendered as a step on the path. */
export type RoadmapLesson = {
  id: Id<"lessons">;
  title: string;
  hasVideo: boolean;
  status: RoadmapNodeStatus;
};
