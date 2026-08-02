// roadmap slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr P1). No routes: it provides the compact CourseNav rail for the Kelas lesson
// sheet — a flat module→lesson nav DERIVED client-side from courses.getOverview +
// progress.getCourseProgress (owns NO data, no convex/roadmap tables). The former
// Silabus⇄Roadmap "quest trail" presentation was removed: it re-drew the same
// modules→lessons+completion as the Silabus overview (DRY).
export { roadmapFeature } from "./config";

// compact secondary-sidebar rail shown beside a lesson sheet
export { CourseNav, type CourseNavProps } from "./components/roadmap-nav";

// types
export type { RoadmapModule, RoadmapNodeStatus } from "./types";
