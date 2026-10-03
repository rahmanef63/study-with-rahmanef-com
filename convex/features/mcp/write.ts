import { ConvexError, v } from "convex/values";
import { internalMutation } from "../../_generated/server";
import { approveHandler, rejectHandler } from "../tenants/admin";
import { markLessonCompleteHandler } from "../progress/mutations";
import { addCommentHandler, softDeleteHandler } from "../comments/comments";
import { requireMcpPrincipal } from "./access";
import { argumentId, parseArguments } from "./arguments";
import { mcpScope } from "./contract";

export const execute = internalMutation({
  args: { tokenHash: v.string(), scope: mcpScope, capability: v.string(), argumentsJson: v.string() }, returns: v.string(),
  handler: async (ctx, request) => {
    const { delegated } = await requireMcpPrincipal(ctx, request.tokenHash, request.scope);
    const a = parseArguments(request.scope, request.capability, request.argumentsJson);
    const id = <T extends "tenants" | "lessons" | "posts" | "comments">(key: string, table: T) => argumentId(delegated, a, key, table);
    let result: unknown;
    switch (request.capability) {
      case "user.complete_lesson": result = await markLessonCompleteHandler(delegated, { lessonId: id("lessonId", "lessons") }); break;
      case "user.comment_add": result = await addCommentHandler(delegated, { bodyMd: a.bodyMd as string,
        ...(a.lessonId ? { lessonId: id("lessonId", "lessons") } : {}), ...(a.postId ? { postId: id("postId", "posts") } : {}), ...(a.parentId ? { parentId: id("parentId", "comments") } : {}),
      }); break;
      case "user.comment_delete": result = await softDeleteHandler(delegated, { commentId: id("commentId", "comments") }); break;
      case "admin.approve_community": result = await approveHandler(delegated, { tenantId: id("tenantId", "tenants") }); break;
      case "admin.suspend_community": result = await rejectHandler(delegated, { tenantId: id("tenantId", "tenants") }); break;
      default: throw new ConvexError({ code: "VALIDATION_FAILED", message: "Capability tidak tersedia sebagai write" });
    }
    return JSON.stringify(result ?? null);
  },
});
