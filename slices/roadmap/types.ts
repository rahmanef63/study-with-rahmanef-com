// roadmap slice — public types. A roadmap is a SECOND presentation of a course's
// modules→lessons + completion (no new data): a learning path.
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
