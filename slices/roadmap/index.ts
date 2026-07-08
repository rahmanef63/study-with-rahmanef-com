// roadmap slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr P1). No routes: it adds a "Roadmap" presentation of a course to the Kelas
// overview (Silabus ⇄ Roadmap toggle). It owns NO data — the roadmap is DERIVED
// client-side from courses.getOverview (module→lesson tree) + progress
// .getCourseProgress (completion). No convex/roadmap tables (unlike the CareerPack
// skill-roadmap this was ported from — our source of truth is modules/lessons).
export { roadmapFeature } from "./config";

// presentational (props-driven, portable)
export { RoadmapNode, type RoadmapNodeProps } from "./components/roadmap-node";

// connected view (drops into the Kelas overview seam)
export { CourseRoadmap, type CourseRoadmapProps } from "./views/course-roadmap";

// types
export type { RoadmapLesson, RoadmapModule, RoadmapNodeStatus } from "./types";
