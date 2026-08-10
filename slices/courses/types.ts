// courses slice — public types (the barrel contract's type half).
// Data shapes mirror the PROJECTIONS returned by convex/features/courses/*
// (not raw Doc<> rows): the public surface never carries contentMd/videoId
// outside the lesson player, and never carries webhook-class secrets at all.
//
// MATERI MODEL (DECISIONS #37): a course is a FLAT ordered list of materi
// (`courseLessons` placements), not a module tree. Nothing here has a
// `modules` key any more, and `Id<"modules">` appears nowhere.
//
// Visibility, written down once because every surface below assumes it:
//   · a materi is visible to a MEMBER of its tenant when status is
//     "published" (a missing status counts as published — legacy rows
//     predate the column);
//   · instructor+ additionally sees drafts;
//   · a COURSE's draft status gates the COURSE PAGE only, never the materi —
//     materi is tenant-level content now, which is the point of the model;
//   · anonymous callers see the etalase (titles/silabus), never content.
import type { Id } from "@convex/_generated/dataModel";

/** Error codes thrown by convex/features/courses (keep in sync with errors.ts). */
export type CoursesErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

export type CourseStatus = "draft" | "published" | "archived";
/** A materi publishes independently of the course that teaches it. */
export type MateriStatus = "draft" | "published";
/**
 * `lessons.kind`. A SKILL is a materi row that carries a copy-able `promptText`
 * — same table, same tags, same permalink, same block editor; only the library
 * it browses in differs. `undefined` on the row MEANS "materi" (the 76 rows
 * that predate the column), which is why nothing here writes "materi" back.
 */
export type LessonKind = "materi" | "skill";
export type ViewerRole = "member" | "instructor" | "owner" | null;

export type CourseLink = { label: string; url: string };

/** Public etalase card (listPublished) — consumed by landing (#5). */
export type CourseCardData = {
  _id: Id<"courses">;
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string;
};

/** Syllabus row — projected, no content fields. `slug` is null only for a
 *  pre-migration materi that never got one; the id route still works. */
export type SyllabusLessonData = {
  _id: Id<"lessons">;
  title: string;
  slug: string | null;
  order: number;
  hasVideo: boolean;
};

/** getOverview result — course header + FLAT ordered silabus. */
export type CourseOverviewData = {
  course: CourseCardData & { status: CourseStatus; tenantId: Id<"tenants"> };
  lessons: SyllabusLessonData[];
  viewerRole: ViewerRole;
  lessonCount: number;
};

/** getLesson result — full member-only materi payload (player).
 *  The course fields are READING CONTEXT: null when the materi is opened
 *  outside a course the viewer can see (standalone library materi). */
export type LessonViewData = {
  _id: Id<"lessons">;
  tenantId: Id<"tenants">;
  title: string;
  slug: string | null;
  status: MateriStatus;
  youtubeVideoId?: string;
  contentMd: string;
  contentBlocks?: unknown;
  links: CourseLink[];
  courseId: Id<"courses"> | null;
  courseSlug: string | null;
  courseTitle: string | null;
  order: number | null;
  prevLessonId: Id<"lessons"> | null;
  nextLessonId: Id<"lessons"> | null;
  viewerRole: Exclude<ViewerRole, null>;
};

/** listForManage row (instructor+ table). */
export type ManageCourseRow = CourseCardData & { status: CourseStatus };

/** getCourseForManage materi row — one PLACEMENT of a materi in this course. */
export type ManagePlacementRow = {
  _id: Id<"lessons">;
  placementId: Id<"courseLessons">;
  title: string;
  slug: string | null;
  status: MateriStatus;
  order: number;
  hasVideo: boolean;
  linkCount: number;
};

/** getCourseForManage result — the editor's flat placement list. */
export type CourseManageData = {
  course: ManageCourseRow & { tenantId: Id<"tenants"> };
  lessons: ManagePlacementRow[];
  lessonCount: number;
};

/** listMateriForManage row — the tenant-wide "tambah materi" picker. */
export type MateriPickerRow = {
  _id: Id<"lessons">;
  title: string;
  slug: string | null;
  status: MateriStatus;
  hasVideo: boolean;
};

/** getLessonForManage result (materi editor form). A materi belongs to a
 *  TENANT, not to a course — placement is a separate call. */
export type LessonEditorData = {
  _id: Id<"lessons">;
  tenantId: Id<"tenants">;
  title: string;
  slug: string | null;
  status: MateriStatus;
  youtubeVideoId?: string;
  contentMd: string;
  contentBlocks?: unknown;
  links: CourseLink[];
};

/** Markdown AST produced by lib/markdown.ts and rendered by MarkdownView. */
// MdInline/MdBlock lived here for the retired in-slice parser. The markdown
// slice owns the AST now (MdNode in @/features/markdown).
