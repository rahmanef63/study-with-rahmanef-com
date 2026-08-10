// Schema SSOT — docs/DATA-MODEL.md. Deviations require updating that doc FIRST
// via the integrator (AGENTS.md §4). Full multi-tenant from day 1: every domain
// table carries tenantId. `_creationTime` is the timestamp (no manual createdAt).
//
// Table definitions live in ./_tables/* (grouped by domain) so no single file
// breaks the 200-LOC ceiling; this file is the composition point and the only
// place `defineSchema` is called. The dir is underscore-prefixed so Convex
// excludes it from the function registry (same rule as _shared/_generated) —
// these modules export table definitions, not queries/mutations.
import { authTables } from "@convex-dev/auth/server";
import { defineSchema } from "convex/server";

import { notifications } from "./_tables/boards";
import { comments, events, postLikes, posts } from "./_tables/community";
import { memberships, profiles, tenants } from "./_tables/identity";
import {
  courseCompletions,
  courseLessons,
  courses,
  lessonCompletions,
  lessonRefs,
  lessonTags,
  lessons,
  quizAttempts,
  quizzes,
} from "./_tables/learning";

export default defineSchema({
  ...authTables,

  // identity & tenancy
  profiles,
  tenants,
  memberships,

  // learning
  courses,
  lessons,
  // materi (DECISIONS #36/#37): placement, tags and page-to-page references.
  courseLessons,
  lessonTags,
  lessonRefs,
  lessonCompletions,
  courseCompletions,
  quizzes,
  quizAttempts,

  // community — Diskusi feed, likes, comments, Kalender
  posts,
  postLikes,
  comments,
  events,

  // in-app inbox (the three legacy boards folded into `posts` — see
  // ./_tables/boards.ts for the retirement note)
  notifications,
});
