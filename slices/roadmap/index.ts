// roadmap slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr P1). No routes: it provides the compact CourseNav rail for the materi
// sheet — a flat materi nav DERIVED client-side from courses.getOverview +
// progress.getCourseProgress (owns NO data, no convex/roadmap tables). The
// former Silabus⇄Roadmap "quest trail" presentation was removed: it re-drew
// the same list+completion as the Silabus overview (DRY).
//
// MATERI MODEL (DECISIONS #37): the rail is a flat ordered list of materi;
// `RoadmapModule` went with the module tree.
export { roadmapFeature } from "./config";

// compact secondary-sidebar rail shown beside a lesson sheet
export { CourseNav, type CourseNavProps } from "./components/roadmap-nav";

// types
export type { RoadmapLesson, RoadmapNodeStatus } from "./types";
