// courses slice — public types (the barrel contract's type half).
// Data shapes mirror the PROJECTIONS returned by convex/features/courses/*
// (not raw Doc<> rows): the public surface never carries contentMd/videoId
// outside the lesson player, and never carries webhook-class secrets at all.
import type { Id } from "@convex/_generated/dataModel";

/** Error codes thrown by convex/features/courses (keep in sync with errors.ts). */
export type CoursesErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";

export type CourseStatus = "draft" | "published" | "archived";
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

/** Syllabus lesson row — projected, no content fields. */
export type SyllabusLessonData = {
  _id: Id<"lessons">;
  title: string;
  order: number;
  hasVideo: boolean;
};

export type SyllabusModuleData = {
  _id: Id<"modules">;
  title: string;
  order: number;
  lessons: SyllabusLessonData[];
};

/** getOverview result — course header + syllabus (public for published). */
export type CourseOverviewData = {
  course: CourseCardData & { status: CourseStatus; tenantId: Id<"tenants"> };
  modules: SyllabusModuleData[];
  viewerRole: ViewerRole;
  lessonCount: number;
};

/** getLesson result — full member-only lesson payload (player). */
export type LessonViewData = {
  _id: Id<"lessons">;
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  tenantId: Id<"tenants">;
  title: string;
  youtubeVideoId?: string;
  contentMd: string;
  links: CourseLink[];
  order: number;
  courseSlug: string;
  courseTitle: string;
  prevLessonId: Id<"lessons"> | null;
  nextLessonId: Id<"lessons"> | null;
};

/** listForManage row (instructor+ table). */
export type ManageCourseRow = CourseCardData & { status: CourseStatus };

/** getCourseTree lesson row (editor list; contentMd fetched separately). */
export type ManageLessonRow = SyllabusLessonData & { linkCount: number };

export type ManageModuleRow = {
  _id: Id<"modules">;
  title: string;
  order: number;
  lessons: ManageLessonRow[];
};

export type CourseTreeData = {
  course: ManageCourseRow & { tenantId: Id<"tenants"> };
  modules: ManageModuleRow[];
};

/** getLessonForManage result (lesson editor form). */
export type LessonEditorData = {
  _id: Id<"lessons">;
  courseId: Id<"courses">;
  moduleId: Id<"modules">;
  title: string;
  youtubeVideoId?: string;
  contentMd: string;
  links: CourseLink[];
  order: number;
};

/** Markdown AST produced by lib/markdown.ts and rendered by MarkdownView. */
export type MdInline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "code"; text: string }
  | { kind: "link"; text: string; url: string };

export type MdBlock =
  | { kind: "heading"; level: 1 | 2 | 3; inline: MdInline[] }
  | { kind: "paragraph"; inline: MdInline[] }
  | { kind: "list"; ordered: boolean; items: MdInline[][] }
  | { kind: "quote"; inline: MdInline[] }
  | { kind: "codeblock"; text: string; lang?: string };
