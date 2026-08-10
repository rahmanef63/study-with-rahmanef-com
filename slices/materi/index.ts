// materi slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr-conventions P1). The integrator mounts:
//   /k/[slug]/materi               ← <MateriLibraryView tenantId tenantSlug
//                                      initialTag gate />
//   /k/[slug]/materi/[lessonSlug]  ← server etalase header (publicGetBySlug,
//                                      generateMetadata, opengraph-image)
//                                      + <MateriDetailView … gate />
//
// THE MODEL (DECISIONS #36/#37): a materi is TENANT-level content with its own
// canonical URL. A course is one ordered arrangement of materi, not their
// owner — so `/k/<t>/materi/<slug>` is the shareable page and
// `/k/<t>/kelas/<course>/<lessonId>` is the same materi read inside a course.
//
// Convex surface (not re-exported; call via api.features.materi.*):
//   queries:publicGetBySlug (ANONYMOUS) · queries:getBySlug ·
//   queries:backlinksFor · queries:getSlug ·
//   library:listLibrary · library:listTags · tags:setTags ·
//   refs:syncRefs (internal)

// feature descriptor
export { materiFeature } from "./config";

// connected views (integrator mounts these)
export {
  MateriLibraryView,
  type MateriLibraryViewProps,
} from "./views/materi-library-view";
export {
  MateriDetailView,
  type MateriDetailViewProps,
} from "./views/materi-detail-view";

// presentational components (props-driven, portable)
export { MateriRow, MateriRowUnlinked, type MateriRowProps } from "./components/materi-row";
export { MateriBody, type MateriBodyProps } from "./components/materi-body";
export {
  MateriBacklinks,
  type MateriBacklinksProps,
} from "./components/materi-backlinks";
export { TagChips, type TagChipsProps } from "./components/tag-chips";
export { TagRow, type TagRowProps } from "./components/tag-row";
export { MateriErrorBoundary } from "./components/materi-error-boundary";

// hooks (reads only — writes live in the manage console, features/courses)
export {
  useMateriLibrary,
  useMateriTags,
  type MateriLibrary,
  type MateriLibraryStatus,
} from "./hooks/use-materi-library";
export { useMateri, useMateriBacklinks } from "./hooks/use-materi";

// lib (pure — safe for server or client)
export {
  buildCourseHref,
  buildMateriHref,
  buildMateriPageHref,
  buildMateriTagHref,
} from "./lib/hrefs";
export { extractMateriError, isMateriMissing, materiErrorMessage } from "./lib/errors";
export { INSET_CAPTION, INSET_GROUP, INSET_ROW } from "./lib/inset";

// copy (props-driven defaults)
export {
  MATERI_COPY,
  mergeMateriCopy,
  type MateriCopy,
  type MateriCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export {
  LIBRARY_PAGE_MAX,
  LIBRARY_PAGE_SIZE,
  MAX_TAGS_PER_LESSON,
  MAX_TAGS_RETURNED,
  SEARCH_FROM,
  TAG_CHIPS_SHOWN,
} from "./config/limits";

// types
export type {
  CourseStatus,
  MateriBacklinks as MateriBacklinksData,
  MateriCard,
  MateriCourseRef,
  MateriDetail,
  MateriErrorCode,
  MateriLink,
  MateriRef,
  MateriRole,
  MateriStatus,
  PublicMateri,
  TagCount,
} from "./types";
