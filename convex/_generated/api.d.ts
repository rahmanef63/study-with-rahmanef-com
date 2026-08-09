/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _seed_bootstrap from "../_seed/bootstrap.js";
import type * as _seed_communitiesData from "../_seed/communitiesData.js";
import type * as _seed_communityKarierDigital from "../_seed/communityKarierDigital.js";
import type * as _seed_communityKreatorKonten from "../_seed/communityKreatorKonten.js";
import type * as _seed_courseDasarAi from "../_seed/courseDasarAi.js";
import type * as _seed_coursePromptEngineering from "../_seed/coursePromptEngineering.js";
import type * as _seed_coursesData from "../_seed/coursesData.js";
import type * as _seed_engagementData from "../_seed/engagementData.js";
import type * as _seed_posts from "../_seed/posts.js";
import type * as _seed_seedContent from "../_seed/seedContent.js";
import type * as _seed_seedEngagement from "../_seed/seedEngagement.js";
import type * as _seed_seedWorld from "../_seed/seedWorld.js";
import type * as _seed_types from "../_seed/types.js";
import type * as _shared_auth from "../_shared/auth.js";
import type * as _tables_boards from "../_tables/boards.js";
import type * as _tables_community from "../_tables/community.js";
import type * as _tables_identity from "../_tables/identity.js";
import type * as _tables_learning from "../_tables/learning.js";
import type * as auth from "../auth.js";
import type * as features_analytics_access from "../features/analytics/access.js";
import type * as features_analytics_aggregate from "../features/analytics/aggregate.js";
import type * as features_analytics_constants from "../features/analytics/constants.js";
import type * as features_analytics_errors from "../features/analytics/errors.js";
import type * as features_analytics_queries from "../features/analytics/queries.js";
import type * as features_comments_access from "../features/comments/access.js";
import type * as features_comments_antiSpam from "../features/comments/antiSpam.js";
import type * as features_comments_comments from "../features/comments/comments.js";
import type * as features_comments_errors from "../features/comments/errors.js";
import type * as features_comments_notify from "../features/comments/notify.js";
import type * as features_comments_projections from "../features/comments/projections.js";
import type * as features_comments_queries from "../features/comments/queries.js";
import type * as features_comments_validate from "../features/comments/validate.js";
import type * as features_courses_access from "../features/courses/access.js";
import type * as features_courses_courses from "../features/courses/courses.js";
import type * as features_courses_errors from "../features/courses/errors.js";
import type * as features_courses_lessons from "../features/courses/lessons.js";
import type * as features_courses_manage from "../features/courses/manage.js";
import type * as features_courses_modules from "../features/courses/modules.js";
import type * as features_courses_queries from "../features/courses/queries.js";
import type * as features_courses_validate from "../features/courses/validate.js";
import type * as features_events_access from "../features/events/access.js";
import type * as features_events_errors from "../features/events/errors.js";
import type * as features_events_mutations from "../features/events/mutations.js";
import type * as features_events_projections from "../features/events/projections.js";
import type * as features_events_queries from "../features/events/queries.js";
import type * as features_events_recurring from "../features/events/recurring.js";
import type * as features_events_validate from "../features/events/validate.js";
import type * as features_leaderboard_constants from "../features/leaderboard/constants.js";
import type * as features_leaderboard_derive from "../features/leaderboard/derive.js";
import type * as features_leaderboard_errors from "../features/leaderboard/errors.js";
import type * as features_leaderboard_queries from "../features/leaderboard/queries.js";
import type * as features_notifications_errors from "../features/notifications/errors.js";
import type * as features_notifications_notifications from "../features/notifications/notifications.js";
import type * as features_notifications_projections from "../features/notifications/projections.js";
import type * as features_notifications_queries from "../features/notifications/queries.js";
import type * as features_notifications_refs from "../features/notifications/refs.js";
import type * as features_notifications_validate from "../features/notifications/validate.js";
import type * as features_posts_access from "../features/posts/access.js";
import type * as features_posts_antiSpam from "../features/posts/antiSpam.js";
import type * as features_posts_discord from "../features/posts/discord.js";
import type * as features_posts_errors from "../features/posts/errors.js";
import type * as features_posts_likes from "../features/posts/likes.js";
import type * as features_posts_notify from "../features/posts/notify.js";
import type * as features_posts_posts from "../features/posts/posts.js";
import type * as features_posts_projections from "../features/posts/projections.js";
import type * as features_posts_queries from "../features/posts/queries.js";
import type * as features_posts_refs from "../features/posts/refs.js";
import type * as features_posts_validate from "../features/posts/validate.js";
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
import type * as features_progress_recents from "../features/progress/recents.js";
import type * as features_quiz_access from "../features/quiz/access.js";
import type * as features_quiz_attempts from "../features/quiz/attempts.js";
import type * as features_quiz_builder from "../features/quiz/builder.js";
import type * as features_quiz_errors from "../features/quiz/errors.js";
import type * as features_quiz_grade from "../features/quiz/grade.js";
import type * as features_quiz_manage from "../features/quiz/manage.js";
import type * as features_quiz_taking from "../features/quiz/taking.js";
import type * as features_quiz_validate from "../features/quiz/validate.js";
import type * as features_search_errors from "../features/search/errors.js";
import type * as features_search_projections from "../features/search/projections.js";
import type * as features_search_queries from "../features/search/queries.js";
import type * as features_search_snippet from "../features/search/snippet.js";
import type * as features_search_validate from "../features/search/validate.js";
import type * as features_tenants_admin from "../features/tenants/admin.js";
import type * as features_tenants_helpers from "../features/tenants/helpers.js";
import type * as features_tenants_members from "../features/tenants/members.js";
import type * as features_tenants_mutations from "../features/tenants/mutations.js";
import type * as features_tenants_queries from "../features/tenants/queries.js";
import type * as features_tenants_requestHelpers from "../features/tenants/requestHelpers.js";
import type * as features_tenants_requests from "../features/tenants/requests.js";
import type * as http from "../http.js";
import type * as seed from "../seed.js";
import type * as seedAiKerja from "../seedAiKerja.js";
import type * as seedAnalisisData from "../seedAnalisisData.js";
import type * as seedMultiAgent from "../seedMultiAgent.js";
import type * as seedWebDev from "../seedWebDev.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_seed/bootstrap": typeof _seed_bootstrap;
  "_seed/communitiesData": typeof _seed_communitiesData;
  "_seed/communityKarierDigital": typeof _seed_communityKarierDigital;
  "_seed/communityKreatorKonten": typeof _seed_communityKreatorKonten;
  "_seed/courseDasarAi": typeof _seed_courseDasarAi;
  "_seed/coursePromptEngineering": typeof _seed_coursePromptEngineering;
  "_seed/coursesData": typeof _seed_coursesData;
  "_seed/engagementData": typeof _seed_engagementData;
  "_seed/posts": typeof _seed_posts;
  "_seed/seedContent": typeof _seed_seedContent;
  "_seed/seedEngagement": typeof _seed_seedEngagement;
  "_seed/seedWorld": typeof _seed_seedWorld;
  "_seed/types": typeof _seed_types;
  "_shared/auth": typeof _shared_auth;
  "_tables/boards": typeof _tables_boards;
  "_tables/community": typeof _tables_community;
  "_tables/identity": typeof _tables_identity;
  "_tables/learning": typeof _tables_learning;
  auth: typeof auth;
  "features/analytics/access": typeof features_analytics_access;
  "features/analytics/aggregate": typeof features_analytics_aggregate;
  "features/analytics/constants": typeof features_analytics_constants;
  "features/analytics/errors": typeof features_analytics_errors;
  "features/analytics/queries": typeof features_analytics_queries;
  "features/comments/access": typeof features_comments_access;
  "features/comments/antiSpam": typeof features_comments_antiSpam;
  "features/comments/comments": typeof features_comments_comments;
  "features/comments/errors": typeof features_comments_errors;
  "features/comments/notify": typeof features_comments_notify;
  "features/comments/projections": typeof features_comments_projections;
  "features/comments/queries": typeof features_comments_queries;
  "features/comments/validate": typeof features_comments_validate;
  "features/courses/access": typeof features_courses_access;
  "features/courses/courses": typeof features_courses_courses;
  "features/courses/errors": typeof features_courses_errors;
  "features/courses/lessons": typeof features_courses_lessons;
  "features/courses/manage": typeof features_courses_manage;
  "features/courses/modules": typeof features_courses_modules;
  "features/courses/queries": typeof features_courses_queries;
  "features/courses/validate": typeof features_courses_validate;
  "features/events/access": typeof features_events_access;
  "features/events/errors": typeof features_events_errors;
  "features/events/mutations": typeof features_events_mutations;
  "features/events/projections": typeof features_events_projections;
  "features/events/queries": typeof features_events_queries;
  "features/events/recurring": typeof features_events_recurring;
  "features/events/validate": typeof features_events_validate;
  "features/leaderboard/constants": typeof features_leaderboard_constants;
  "features/leaderboard/derive": typeof features_leaderboard_derive;
  "features/leaderboard/errors": typeof features_leaderboard_errors;
  "features/leaderboard/queries": typeof features_leaderboard_queries;
  "features/notifications/errors": typeof features_notifications_errors;
  "features/notifications/notifications": typeof features_notifications_notifications;
  "features/notifications/projections": typeof features_notifications_projections;
  "features/notifications/queries": typeof features_notifications_queries;
  "features/notifications/refs": typeof features_notifications_refs;
  "features/notifications/validate": typeof features_notifications_validate;
  "features/posts/access": typeof features_posts_access;
  "features/posts/antiSpam": typeof features_posts_antiSpam;
  "features/posts/discord": typeof features_posts_discord;
  "features/posts/errors": typeof features_posts_errors;
  "features/posts/likes": typeof features_posts_likes;
  "features/posts/notify": typeof features_posts_notify;
  "features/posts/posts": typeof features_posts_posts;
  "features/posts/projections": typeof features_posts_projections;
  "features/posts/queries": typeof features_posts_queries;
  "features/posts/refs": typeof features_posts_refs;
  "features/posts/validate": typeof features_posts_validate;
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
  "features/progress/recents": typeof features_progress_recents;
  "features/quiz/access": typeof features_quiz_access;
  "features/quiz/attempts": typeof features_quiz_attempts;
  "features/quiz/builder": typeof features_quiz_builder;
  "features/quiz/errors": typeof features_quiz_errors;
  "features/quiz/grade": typeof features_quiz_grade;
  "features/quiz/manage": typeof features_quiz_manage;
  "features/quiz/taking": typeof features_quiz_taking;
  "features/quiz/validate": typeof features_quiz_validate;
  "features/search/errors": typeof features_search_errors;
  "features/search/projections": typeof features_search_projections;
  "features/search/queries": typeof features_search_queries;
  "features/search/snippet": typeof features_search_snippet;
  "features/search/validate": typeof features_search_validate;
  "features/tenants/admin": typeof features_tenants_admin;
  "features/tenants/helpers": typeof features_tenants_helpers;
  "features/tenants/members": typeof features_tenants_members;
  "features/tenants/mutations": typeof features_tenants_mutations;
  "features/tenants/queries": typeof features_tenants_queries;
  "features/tenants/requestHelpers": typeof features_tenants_requestHelpers;
  "features/tenants/requests": typeof features_tenants_requests;
  http: typeof http;
  seed: typeof seed;
  seedAiKerja: typeof seedAiKerja;
  seedAnalisisData: typeof seedAnalisisData;
  seedMultiAgent: typeof seedMultiAgent;
  seedWebDev: typeof seedWebDev;
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
