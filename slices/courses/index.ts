// courses slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Consumers: #3 progress (SyllabusList
// completedLessonIds + LessonView completionSlot + hooks/types), #5 landing
// (CourseCard + usePublishedCourses), integrator route mounts (views).
// Convex surface (not re-exported here — call via api.features.courses.*):
//   queries.listPublished · queries.getOverview · queries.getLesson
//   manage.listForManage · manage.getCourseTree · manage.getLessonForManage
//   courses.create · courses.update · courses.setStatus
//   modules.createModule · modules.renameModule · modules.reorderModules ·
//   modules.deleteModule · lessons.createLesson · lessons.updateLesson ·
//   lessons.reorderLessons · lessons.deleteLesson

// feature descriptor
export { coursesFeature } from "./config";

// member/public components
export { CourseCard, type CourseCardProps } from "./components/course-card";
export { CourseOverview, type CourseOverviewProps } from "./components/course-overview";
export { SyllabusList, type SyllabusListProps } from "./components/syllabus-list";
export { LessonView, type LessonViewProps } from "./components/lesson-view";
export { LessonLinks, type LessonLinksProps } from "./components/lesson-links";
export { MarkdownView, type MarkdownViewProps } from "./components/markdown-view";
export { YoutubeEmbed, type YoutubeEmbedProps } from "./components/youtube-embed";

// route-level client views (integrator mounts these under /t/[slug]/…)
export { CourseCatalog, type CourseCatalogProps } from "./views/course-catalog";
export { CourseOverviewView, type CourseOverviewViewProps } from "./views/course-overview-view";
export { LessonPlayerView, type LessonPlayerViewProps } from "./views/lesson-player-view";
export { ManageCoursesView, type ManageCoursesViewProps } from "./views/manage-courses-view";
export {
  ManageCourseEditorView,
  type ManageCourseEditorViewProps,
} from "./views/manage-course-editor-view";

// hooks (reads + writes)
export {
  useCourseOverview,
  useCourseTree,
  useLesson,
  useLessonForManage,
  useManageCourses,
  usePublishedCourses,
} from "./hooks/use-courses";
export {
  useCourseMutations,
  useModuleMutations,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "./hooks/use-course-mutations";
export {
  useLessonMutations,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "./hooks/use-lesson-mutations";

// lib (pure — safe for server or client)
export { parseInline, parseMarkdown } from "./lib/markdown";
export {
  buildYoutubeEmbedUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
  isValidYoutubeVideoId,
} from "./lib/youtube";
export { coursesErrorMessage, extractCoursesError } from "./lib/errors";

// copy + limits (props-driven defaults)
export { COURSES_COPY, mergeCopy, type CoursesCopy, type CoursesCopyOverride } from "./config/copy";
export {
  MAX_CONTENT_MD_CHARS,
  MAX_LESSONS_PER_COURSE,
  MAX_LINKS_PER_LESSON,
  MAX_MODULES_PER_COURSE,
} from "./config/limits";

// types
export type {
  CourseCardData,
  CourseLink,
  CourseOverviewData,
  CourseStatus,
  CoursesErrorCode,
  CourseTreeData,
  LessonEditorData,
  LessonViewData,
  ManageCourseRow,
  ManageLessonRow,
  ManageModuleRow,
  MdBlock,
  MdInline,
  SyllabusLessonData,
  SyllabusModuleData,
  ViewerRole,
} from "./types";
