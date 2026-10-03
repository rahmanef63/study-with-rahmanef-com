import { ConvexError, v } from "convex/values";
import { internalQuery } from "../../_generated/server";
import { listLibraryHandler } from "../materi/library";
import { getCurrentProfileHandler } from "../profiles/queries";
import { listMineHandler } from "../tenants/queries";
import { listPendingHandler } from "../tenants/admin";
import { getLessonHandler, getOverviewHandler, listPublishedHandler } from "../courses/queries";
import { getCourseProgressHandler } from "../progress/queries";
import { listByLessonHandler, listByPostHandler } from "../comments/queries";
import { getPlatformAnalyticsHandler } from "../analytics/platform";
import { getTrafficAnalyticsHandler } from "../traffic/queries";
import { listUsersHandler, getUserDetailHandler } from "../userAnalytics";
import { requireMcpPrincipal } from "./access";
import { argumentId, parseArguments } from "./arguments";
import { mcpScope } from "./contract";

/** Explicit allowlist delegates to the same guarded implementation as browser. */
export const execute = internalQuery({
  args: { tokenHash: v.string(), scope: mcpScope, capability: v.string(), argumentsJson: v.string() }, returns: v.string(),
  handler: async (ctx, request) => {
    const { delegated } = await requireMcpPrincipal(ctx, request.tokenHash, request.scope);
    const a = parseArguments(request.scope, request.capability, request.argumentsJson);
    const id = <T extends "tenants" | "courses" | "lessons" | "posts" | "users">(key: string, table: T) => argumentId(delegated, a, key, table);
    let result: unknown;
    switch (request.capability) {
      case "user.profile": result = await getCurrentProfileHandler(delegated); break;
      case "user.communities": result = await listMineHandler(delegated); break;
      case "user.library": result = await listLibraryHandler(delegated, { tenantId: id("tenantId", "tenants"), kind: a.kind as "materi" | "skill" | undefined, tag: a.tag as string | undefined, sort: a.sort as "newest" | "oldest" | "title" | undefined, paginationOpts: { cursor: a.cursor as string | undefined ?? null, numItems: a.limit as number | undefined ?? 20, maximumBytesRead: 512 * 1024, maximumRowsRead: 100 } }); break;
      case "user.course_catalog": result = await listPublishedHandler(delegated, { tenantId: id("tenantId", "tenants") }); break;
      case "user.course_overview": result = await getOverviewHandler(delegated, { tenantId: id("tenantId", "tenants"), courseSlug: a.courseSlug as string }); break;
      case "user.lesson": result = await getLessonHandler(delegated, { lessonId: id("lessonId", "lessons"), ...(a.courseId ? { courseId: id("courseId", "courses") } : {}) }); break;
      case "user.course_progress": result = await getCourseProgressHandler(delegated, { courseId: id("courseId", "courses") }); break;
      case "user.lesson_comments": result = await listByLessonHandler(delegated, { lessonId: id("lessonId", "lessons") }); break;
      case "user.post_comments": result = await listByPostHandler(delegated, { postId: id("postId", "posts") }); break;
      case "admin.users": result = await listUsersHandler(delegated, { paginationOpts: { numItems: a.limit as number | undefined ?? 20, cursor: a.cursor as string | undefined ?? null }, search: a.search as string | undefined }); break;
      case "admin.user_detail": result = await getUserDetailHandler(delegated, { userId: id("userId", "users") }); break;
      case "admin.pending_communities": result = await listPendingHandler(delegated, { limit: a.limit as number | undefined }); break;
      case "admin.learning_analytics": result = await getPlatformAnalyticsHandler(delegated, { days: a.days as 7 | 30 | 90 }); break;
      case "admin.traffic_analytics": result = await getTrafficAnalyticsHandler(delegated, { days: a.days as 7 | 30 }); break;
      default: throw new ConvexError({ code: "VALIDATION_FAILED", message: "Capability tidak tersedia sebagai read" });
    }
    return JSON.stringify(result ?? null);
  },
});
