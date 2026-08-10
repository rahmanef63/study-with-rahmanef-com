// materi slice — the shapes the server actually returns, mirrored for the UI.
//
// Hand-mirrored rather than imported from convex/features/materi/projections:
// a slice must stay host-agnostic (rr P1), and the Convex projection file is
// server code. The hooks assert the match — each one annotates its return type
// with these, so `npx tsc --noEmit` fails the moment the server projection and
// this file drift.
//
// THE VISIBILITY CONTRACT these types encode (convex/features/materi/access.ts
// is where it is written out in full, and where it is TESTED):
//   · a member of the materi's tenant sees it when status is "published" —
//     and an ABSENT status counts as published (76 rows predate the column);
//   · instructor+ additionally sees drafts;
//   · a COURSE's draft status gates the course page only, never the materi;
//   · an anonymous caller gets the etalase (title/tags/published courses) and
//     never the body. That is why `PublicMateri` has no `contentMd`.
import type { Id } from "@convex/_generated/dataModel";

export type MateriRole = "member" | "instructor" | "owner";
export type MateriStatus = "draft" | "published";
export type CourseStatus = "draft" | "published" | "archived";

/** A link out of a materi (same shape as a lesson link). */
export type MateriLink = { label: string; url: string };

/** A course that teaches this materi. `order` is its position in THAT course. */
export type MateriCourseRef = {
  _id: Id<"courses">;
  slug: string;
  title: string;
  status: CourseStatus;
  order: number;
};

/** Another materi, as a link target. `slug` is null only for rows the backfill
 *  never reached (none in production; the schema still permits it). */
export type MateriRef = {
  _id: Id<"lessons">;
  slug: string | null;
  title: string;
};

/**
 * ANONYMOUS etalase projection — what a crawler and a logged-out recipient of
 * a shared link get. No body in any form.
 */
export type PublicMateri = {
  _id: Id<"lessons">;
  slug: string;
  title: string;
  tags: string[];
  hasVideo: boolean;
  /** Published courses only. */
  courses: Array<{ slug: string; title: string }>;
  tenant: { slug: string; name: string };
  createdAt: number;
};

/** MEMBER+ projection: the whole materi page. */
export type MateriDetail = {
  _id: Id<"lessons">;
  tenantId: Id<"tenants">;
  slug: string | null;
  title: string;
  status: MateriStatus;
  youtubeVideoId?: string;
  contentMd: string;
  contentBlocks?: string;
  links: MateriLink[];
  tags: string[];
  courses: MateriCourseRef[];
  backlinks: MateriRef[];
  viewerRole: MateriRole;
  canEdit: boolean;
  createdAt: number;
};

/** One row of the library. `updatedAt` is `_creationTime` — `lessons` has no
 *  mtime column, so "terbaru" means "dibuat terakhir". */
export type MateriCard = {
  _id: Id<"lessons">;
  slug: string | null;
  title: string;
  tags: string[];
  courseCount: number;
  updatedAt: number;
};

/** "Muncul di" — the two ways one materi is reachable from another surface. */
export type MateriBacklinks = {
  materi: MateriRef[];
  courses: MateriCourseRef[];
};

export type TagCount = { tag: string; count: number };

export type MateriErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";
