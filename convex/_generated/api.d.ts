/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _shared_auth from "../_shared/auth.js";
import type * as auth from "../auth.js";
import type * as features_announcements_discord from "../features/announcements/discord.js";
import type * as features_announcements_errors from "../features/announcements/errors.js";
import type * as features_announcements_mutations from "../features/announcements/mutations.js";
import type * as features_announcements_queries from "../features/announcements/queries.js";
import type * as features_announcements_refs from "../features/announcements/refs.js";
import type * as features_announcements_validate from "../features/announcements/validate.js";
import type * as features_courses_access from "../features/courses/access.js";
import type * as features_courses_courses from "../features/courses/courses.js";
import type * as features_courses_errors from "../features/courses/errors.js";
import type * as features_courses_lessons from "../features/courses/lessons.js";
import type * as features_courses_manage from "../features/courses/manage.js";
import type * as features_courses_modules from "../features/courses/modules.js";
import type * as features_courses_queries from "../features/courses/queries.js";
import type * as features_courses_validate from "../features/courses/validate.js";
import type * as features_profiles_mutations from "../features/profiles/mutations.js";
import type * as features_profiles_public from "../features/profiles/public.js";
import type * as features_profiles_queries from "../features/profiles/queries.js";
import type * as features_profiles_types from "../features/profiles/types.js";
import type * as features_profiles_username from "../features/profiles/username.js";
import type * as features_progress_access from "../features/progress/access.js";
import type * as features_progress_constants from "../features/progress/constants.js";
import type * as features_progress_derive from "../features/progress/derive.js";
import type * as features_progress_errors from "../features/progress/errors.js";
import type * as features_progress_mutations from "../features/progress/mutations.js";
import type * as features_progress_queries from "../features/progress/queries.js";
import type * as features_quiz_access from "../features/quiz/access.js";
import type * as features_quiz_attempts from "../features/quiz/attempts.js";
import type * as features_quiz_builder from "../features/quiz/builder.js";
import type * as features_quiz_errors from "../features/quiz/errors.js";
import type * as features_quiz_grade from "../features/quiz/grade.js";
import type * as features_quiz_manage from "../features/quiz/manage.js";
import type * as features_quiz_taking from "../features/quiz/taking.js";
import type * as features_quiz_validate from "../features/quiz/validate.js";
import type * as features_resources_access from "../features/resources/access.js";
import type * as features_resources_antiSpam from "../features/resources/antiSpam.js";
import type * as features_resources_errors from "../features/resources/errors.js";
import type * as features_resources_projections from "../features/resources/projections.js";
import type * as features_resources_queries from "../features/resources/queries.js";
import type * as features_resources_resources from "../features/resources/resources.js";
import type * as features_resources_suggestions from "../features/resources/suggestions.js";
import type * as features_resources_validate from "../features/resources/validate.js";
import type * as features_tenants_admin from "../features/tenants/admin.js";
import type * as features_tenants_helpers from "../features/tenants/helpers.js";
import type * as features_tenants_members from "../features/tenants/members.js";
import type * as features_tenants_mutations from "../features/tenants/mutations.js";
import type * as features_tenants_queries from "../features/tenants/queries.js";
import type * as features_tenants_requestHelpers from "../features/tenants/requestHelpers.js";
import type * as features_tenants_requests from "../features/tenants/requests.js";
import type * as http from "../http.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as setup from "../setup.js";
import type * as update from "../update.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_shared/auth": typeof _shared_auth;
  auth: typeof auth;
  "features/announcements/discord": typeof features_announcements_discord;
  "features/announcements/errors": typeof features_announcements_errors;
  "features/announcements/mutations": typeof features_announcements_mutations;
  "features/announcements/queries": typeof features_announcements_queries;
  "features/announcements/refs": typeof features_announcements_refs;
  "features/announcements/validate": typeof features_announcements_validate;
  "features/courses/access": typeof features_courses_access;
  "features/courses/courses": typeof features_courses_courses;
  "features/courses/errors": typeof features_courses_errors;
  "features/courses/lessons": typeof features_courses_lessons;
  "features/courses/manage": typeof features_courses_manage;
  "features/courses/modules": typeof features_courses_modules;
  "features/courses/queries": typeof features_courses_queries;
  "features/courses/validate": typeof features_courses_validate;
  "features/profiles/mutations": typeof features_profiles_mutations;
  "features/profiles/public": typeof features_profiles_public;
  "features/profiles/queries": typeof features_profiles_queries;
  "features/profiles/types": typeof features_profiles_types;
  "features/profiles/username": typeof features_profiles_username;
  "features/progress/access": typeof features_progress_access;
  "features/progress/constants": typeof features_progress_constants;
  "features/progress/derive": typeof features_progress_derive;
  "features/progress/errors": typeof features_progress_errors;
  "features/progress/mutations": typeof features_progress_mutations;
  "features/progress/queries": typeof features_progress_queries;
  "features/quiz/access": typeof features_quiz_access;
  "features/quiz/attempts": typeof features_quiz_attempts;
  "features/quiz/builder": typeof features_quiz_builder;
  "features/quiz/errors": typeof features_quiz_errors;
  "features/quiz/grade": typeof features_quiz_grade;
  "features/quiz/manage": typeof features_quiz_manage;
  "features/quiz/taking": typeof features_quiz_taking;
  "features/quiz/validate": typeof features_quiz_validate;
  "features/resources/access": typeof features_resources_access;
  "features/resources/antiSpam": typeof features_resources_antiSpam;
  "features/resources/errors": typeof features_resources_errors;
  "features/resources/projections": typeof features_resources_projections;
  "features/resources/queries": typeof features_resources_queries;
  "features/resources/resources": typeof features_resources_resources;
  "features/resources/suggestions": typeof features_resources_suggestions;
  "features/resources/validate": typeof features_resources_validate;
  "features/tenants/admin": typeof features_tenants_admin;
  "features/tenants/helpers": typeof features_tenants_helpers;
  "features/tenants/members": typeof features_tenants_members;
  "features/tenants/mutations": typeof features_tenants_mutations;
  "features/tenants/queries": typeof features_tenants_queries;
  "features/tenants/requestHelpers": typeof features_tenants_requestHelpers;
  "features/tenants/requests": typeof features_tenants_requests;
  http: typeof http;
  seed: typeof seed;
  settings: typeof settings;
  setup: typeof setup;
  update: typeof update;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
