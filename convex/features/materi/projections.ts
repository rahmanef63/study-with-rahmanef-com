// materi feature — the exact shapes that leave the server. Explicit projections
// (never a raw doc) are P0 for the anonymous surface and good hygiene for the
// rest: a new column added to `lessons` cannot silently start shipping.
import type { Id } from "../../_generated/dataModel";
import type { TenantRole } from "../../_shared/auth";

/** A course that teaches this materi. `order` = its position in THAT course. */
export type MateriCourseRef = {
  _id: Id<"courses">;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  order: number;
};

/** Another materi, as a link target. `slug` is null only for rows the backfill
 *  has not reached (none in production; the schema still allows it). */
export type MateriRef = {
  _id: Id<"lessons">;
  slug: string | null;
  title: string;
};

/** "materi" | "skill" — `lessons.kind`, with `undefined` read as "materi". */
export type MateriKind = "materi" | "skill";

/**
 * ANONYMOUS etalase projection. Deliberately has NO contentMd, NO contentBlocks,
 * NO links and NO youtubeVideoId — a shared materi link must unfurl with a real
 * title and index, and stop exactly there.
 *
 * `kind` IS here (a crawler and a share card may know this page is a skill);
 * `promptText` is NOT and must never be. The prompt is the thing a member joined
 * for — putting it on the anonymous surface would give the product away on a URL
 * anyone can guess. queries.test.ts asserts its absence key by key.
 */
export type PublicMateri = {
  _id: Id<"lessons">;
  slug: string;
  title: string;
  kind: MateriKind;
  tags: string[];
  hasVideo: boolean;
  /** Published courses only — a draft course is never named to an anon caller. */
  courses: Array<{ slug: string; title: string }>;
  tenant: { slug: string; name: string };
  createdAt: number;
};

/** Member+ projection: the whole materi page. */
export type MateriDetail = {
  _id: Id<"lessons">;
  tenantId: Id<"tenants">;
  slug: string | null;
  title: string;
  status: "draft" | "published";
  kind: MateriKind;
  /** MEMBER+ ONLY, and only ever set on a skill. Absent from `PublicMateri`. */
  promptText?: string;
  youtubeVideoId?: string;
  contentMd: string;
  contentBlocks?: string;
  links: Array<{ label: string; url: string }>;
  tags: string[];
  courses: MateriCourseRef[];
  backlinks: MateriRef[];
  viewerRole: TenantRole;
  /** Viewer is the author, or instructor+ of the tenant. */
  canEdit: boolean;
  createdAt: number;
};

/** Library row. `updatedAt` is `_creationTime`: `lessons` has no mtime column
 *  (schema note: "_creationTime is the timestamp, no manual createdAt"). */
export type MateriCard = {
  _id: Id<"lessons">;
  slug: string | null;
  title: string;
  kind: MateriKind;
  /** First line(s) of a skill's prompt, truncated — the card renders it as a
   *  teaser so the reader can tell two prompts apart without opening either.
   *  `null` for a materi and for a skill with no prompt yet. MEMBER+ surface. */
  promptPreview: string | null;
  tags: string[];
  courseCount: number;
  updatedAt: number;
};

/** Library ordering. `newest`/`oldest` ride the index; `title` is A→Z. */
export type MateriSort = "newest" | "oldest" | "title";

export type MateriPage = {
  page: MateriCard[];
  isDone: boolean;
  continueCursor: string;
};

export type TagCount = { tag: string; count: number };

/** "Muncul di" — the two ways one materi is reachable from another surface. */
export type MateriBacklinks = {
  /** Materi pages whose content references this one (lessonRefs.by_to). */
  materi: MateriRef[];
  /** Courses that teach it (courseLessons.by_lesson). */
  courses: MateriCourseRef[];
};
