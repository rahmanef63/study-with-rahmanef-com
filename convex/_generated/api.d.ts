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
import type * as features_courses_access from "../features/courses/access.js";
import type * as features_courses_courses from "../features/courses/courses.js";
import type * as features_courses_errors from "../features/courses/errors.js";
import type * as features_courses_lessons from "../features/courses/lessons.js";
import type * as features_courses_manage from "../features/courses/manage.js";
import type * as features_courses_modules from "../features/courses/modules.js";
import type * as features_courses_queries from "../features/courses/queries.js";
import type * as features_courses_validate from "../features/courses/validate.js";
import type * as features_profiles_mutations from "../features/profiles/mutations.js";
import type * as features_profiles_queries from "../features/profiles/queries.js";
import type * as features_profiles_types from "../features/profiles/types.js";
import type * as features_profiles_username from "../features/profiles/username.js";
import type * as features_tenants_helpers from "../features/tenants/helpers.js";
import type * as features_tenants_members from "../features/tenants/members.js";
import type * as features_tenants_mutations from "../features/tenants/mutations.js";
import type * as features_tenants_queries from "../features/tenants/queries.js";
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
  "features/courses/access": typeof features_courses_access;
  "features/courses/courses": typeof features_courses_courses;
  "features/courses/errors": typeof features_courses_errors;
  "features/courses/lessons": typeof features_courses_lessons;
  "features/courses/manage": typeof features_courses_manage;
  "features/courses/modules": typeof features_courses_modules;
  "features/courses/queries": typeof features_courses_queries;
  "features/courses/validate": typeof features_courses_validate;
  "features/profiles/mutations": typeof features_profiles_mutations;
  "features/profiles/queries": typeof features_profiles_queries;
  "features/profiles/types": typeof features_profiles_types;
  "features/profiles/username": typeof features_profiles_username;
  "features/tenants/helpers": typeof features_tenants_helpers;
  "features/tenants/members": typeof features_tenants_members;
  "features/tenants/mutations": typeof features_tenants_mutations;
  "features/tenants/queries": typeof features_tenants_queries;
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
