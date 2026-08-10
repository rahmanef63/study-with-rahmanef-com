// courses slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Consumers: #3 progress (SyllabusList
// completedLessonIds + LessonView completionSlot + hooks/types), #5 landing
// (CourseCard + usePublishedCourses), integrator route mounts (views).
//
// MATERI MODEL (DECISIONS #37): a course is a FLAT ordered list of materi
// placements. Nothing here exposes modules any more.
// Convex surface (not re-exported here — call via api.features.courses.*):
//   queries.listPublished · queries.getOverview · queries.getLesson
//   manage.listForManage · manage.getCourseForManage ·
//   manage.listMateriForManage · manage.getLessonForManage ·
//   manage.addLessonToCourse · manage.removeLessonFromCourse ·
//   manage.reorderCourseLessons
//   courses.create · courses.update · courses.setStatus
//   lessons.createLesson · lessons.updateLesson · lessons.setLessonStatus ·
//   lessons.deleteLesson
// A SKILL is one of those `lessons` rows with kind:"skill" + promptText, so the
// same four mutations author it. Its READ surfaces belong to the materi
// feature: materi.library.listLibrary({kind:"skill"}) ·
// materi.skills.searchSkills · materi.skills.getPrompt · materi.tags.setTags.

// feature descriptor
export { coursesFeature } from "./config";

// member/public components
export { CourseCard, type CourseCardProps } from "./components/course-card";
export { CourseCover, type CourseCoverProps } from "./components/course-cover";
export { CourseOverview, type CourseOverviewProps } from "./components/course-overview";
export { SyllabusList, type SyllabusListProps } from "./components/syllabus-list";
export { LessonView, type LessonViewProps } from "./components/lesson-view";
export { LessonLinks, type LessonLinksProps } from "./components/lesson-links";
export { MarkdownView, type MarkdownViewProps } from "./components/markdown-view";
export { YoutubeEmbed, type YoutubeEmbedProps } from "./components/youtube-embed";

// manage primitives — the console (app/k/[slug]/kelola) composes its SKILLS
// section from these instead of cloning the materi authoring UI: a skill is the
// same `lessons` row with `kind: "skill"` and a prompt.
export { LessonDialog, type LessonDialogProps } from "./components/manage/lesson-dialog";
export { ConfirmDialog, type ConfirmDialogProps } from "./components/manage/confirm-dialog";
export { PromptField, type PromptFieldProps } from "./components/manage/prompt-field";

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
  useCourseForManage,
  useCourseOverview,
  useLesson,
  useLessonForManage,
  useManageCourses,
  useMateriForManage,
  usePublishedCourses,
} from "./hooks/use-courses";
export {
  useCourseMutations,
  usePlacementMutations,
  type CreateCourseInput,
  type UpdateCourseInput,
} from "./hooks/use-course-mutations";
export {
  useLessonMutations,
  type CreateLessonInput,
  type UpdateLessonInput,
} from "./hooks/use-lesson-mutations";

// lib (pure — safe for server or client)
// Markdown parsing/rendering is NOT this slice's job any more: it delegates to
// the rr `markdown` slice (15 block types vs the 5 the hand-rolled parser knew).
// Import parseMarkdown / renderNodes from "@/features/markdown" instead — two
// markdown parsers in one repo is exactly the drift that bites later.
export {
  buildYoutubeEmbedUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
  isValidYoutubeVideoId,
} from "./lib/youtube";
export { coursesErrorMessage, extractCoursesError } from "./lib/errors";
export { coverArt, type CoverArt, type CoverLayer } from "./lib/cover-art";

// copy + limits (props-driven defaults)
export { COURSES_COPY, mergeCopy, type CoursesCopy, type CoursesCopyOverride } from "./config/copy";
export {
  MAX_CONTENT_MD_CHARS,
  MAX_LESSONS_PER_COURSE,
  MAX_LINKS_PER_LESSON,
  MAX_PROMPT_CHARS,
  MAX_TAGS_PER_LESSON,
} from "./config/limits";
export { normalizeTag, parseTagInput } from "./lib/tags";

// types
export type {
  CourseCardData,
  CourseLink,
  CourseManageData,
  CourseOverviewData,
  CourseStatus,
  CoursesErrorCode,
  LessonEditorData,
  LessonKind,
  LessonViewData,
  ManageCourseRow,
  ManagePlacementRow,
  MateriPickerRow,
  MateriStatus,
  SyllabusLessonData,
  ViewerRole,
} from "./types";
