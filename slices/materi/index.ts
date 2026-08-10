// materi slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr-conventions P1). The integrator mounts:
//   /k/[slug]/materi               ← <MateriLibraryView tenantId tenantSlug
//                                      initialTag gate />
//   /k/[slug]/materi/[lessonSlug]  ← server etalase header (publicGetBySlug,
//                                      generateMetadata, opengraph-image)
//                                      + <MateriDetailView … gate />
//   /k/[slug]/skills               ← <SkillsLibraryView tenantId tenantSlug
//                                      initialTag kelolaHref gate />
//   /k/[slug]/skills/[lessonSlug]  ← the same server etalase header
//                                      + <MateriDetailView kind="skill" … />
//
// THE MODEL (DECISIONS #36/#37): a materi is TENANT-level content with its own
// canonical URL. A course is one ordered arrangement of materi, not their
// owner — so `/k/<t>/materi/<slug>` is the shareable page and
// `/k/<t>/kelas/<course>/<lessonId>` is the same materi read inside a course.
//
// SKILLS (2026-08-10): a skill is a materi with `lessons.kind === "skill"` and
// its own `promptText` — NOT a new table, which is why it inherited tags,
// search, permalinks, backlinks, OG cards, the sitemap and the block editor
// without a line of new plumbing. It gets its own ROUTE because it is a
// different reading job, and its own detail treatment (the prompt panel);
// everything else on this barrel is shared by both kinds. The two share ONE
// slug namespace, so both permalink pages redirect a wrong-kind slug to the
// canonical route for the row's real kind (`buildKindPageHref`).
//
// Convex surface (not re-exported; call via api.features.materi.*):
//   queries:publicGetBySlug (ANONYMOUS) · queries:publicListSlugs (ANONYMOUS) ·
//   queries:getBySlug · queries:backlinksFor · queries:getSlug ·
//   library:listLibrary (kind/tag/sort) · library:listTags ·
//   skills:searchSkills · skills:getPrompt · tags:setTags ·
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
export {
  SkillsLibraryView,
  type SkillsLibraryViewProps,
} from "./views/skills-library-view";

// presentational components (props-driven, portable)
export { MateriRow, MateriRowUnlinked, type MateriRowProps } from "./components/materi-row";
export {
  MateriList,
  MateriListSkeleton,
  type MateriListProps,
} from "./components/materi-list";
export { LibraryToolbar, type LibraryToolbarProps } from "./components/library-toolbar";
export {
  MateriPageHeader,
  type MateriPageHeaderProps,
} from "./components/materi-page-header";
export { PromptPanel, type PromptPanelProps } from "./components/prompt-panel";
export { SkillsEmpty, type SkillsEmptyProps } from "./components/skills-empty";
export { SortControl, type SortControlProps } from "./components/sort-control";
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
  type MateriLibraryArgs,
  type MateriLibraryStatus,
} from "./hooks/use-materi-library";
export { useMateri, useMateriBacklinks } from "./hooks/use-materi";
export { useSkillSearch, type SkillSearch } from "./hooks/use-skills";

// lib (pure — safe for server or client)
export {
  buildCourseHref,
  buildKindLibraryHref,
  buildKindPageHref,
  buildMateriHref,
  buildMateriPageHref,
  buildMateriTagHref,
  buildSkillPageHref,
  buildSkillsHref,
  buildSkillTagHref,
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
  MAX_PROMPT_CHARS,
  MAX_TAGS_PER_LESSON,
  MAX_TAGS_RETURNED,
  PROMPT_PREVIEW_CHARS,
  SEARCH_FROM,
  SKILL_QUERY_MAX,
  SKILL_QUERY_MIN,
  SKILL_SEARCH_DEBOUNCE_MS,
  SKILL_SEARCH_MAX_RESULTS,
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
  MateriKind,
  MateriLink,
  MateriRef,
  MateriRole,
  MateriSort,
  MateriStatus,
  PublicMateri,
  TagCount,
} from "./types";
