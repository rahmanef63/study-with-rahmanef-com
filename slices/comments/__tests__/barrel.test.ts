// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel,
// RUNTIME against the alias-free modules (precedent: slices/quiz barrel test).
//
// Why type-level for the barrel: the shared vitest.config.mts aliases `@` to
// the repo root, so `@/features/responsive-dialog` (imported by
// delete-comment-dialog.tsx per the barrel-only cross-slice rule) cannot
// resolve under vitest — tsconfig maps `@/features/*` → `./slices/*` but the
// vitest config has no such entry. `import type` is erased at runtime; the
// assertions below are enforced by `npx tsc --noEmit` (DoD §5.1) instead.
// TODO(rr): waiting on integrator — mirror the tsconfig `@/features/*` path in
// vitest.config.mts (proposal in beta's report, seconded from quiz/gamma),
// then switch to a value import of "../index" with typeof checks.
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { commentsFeature } from "../config";
import { COMMENTS_COPY, mergeCommentsCopy } from "../config/copy";
import { MAX_BODY, MAX_COMMENTS_PER_USER_PER_LESSON, MIN_BODY } from "../config/limits";
import { commentsErrorMessage, extractCommentsError } from "../lib/errors";
import { buildThread } from "../lib/thread";
import { formatRelativeTime } from "../lib/time";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the required view, components, hooks, lib and types", () => {
    // view (integrator mounts — required by the prompt)
    expectTypeOf<typeof Barrel.LessonComments>().toBeFunction();
    // components
    expectTypeOf<typeof Barrel.CommentForm>().toBeFunction();
    expectTypeOf<typeof Barrel.CommentItem>().toBeFunction();
    expectTypeOf<typeof Barrel.CommentThread>().toBeFunction();
    expectTypeOf<typeof Barrel.CommentsEmptyState>().toBeFunction();
    expectTypeOf<typeof Barrel.DeleteCommentDialog>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.useLessonComments>().toBeFunction();
    expectTypeOf<typeof Barrel.useAddComment>().toBeFunction();
    expectTypeOf<typeof Barrel.useDeleteComment>().toBeFunction();
    // lib
    expectTypeOf<typeof Barrel.buildThread>().toBeFunction();
    expectTypeOf<typeof Barrel.formatRelativeTime>().toBeFunction();
    // P0 type shape: the deleted placeholder never carries a body/author
    expectTypeOf<Extract<Barrel.CommentItemData, { deleted: true }>>().toHaveProperty("bodyMd");
    expectTypeOf<Extract<Barrel.CommentItemData, { deleted: true }>["bodyMd"]>().toEqualTypeOf<null>();
    expectTypeOf<Extract<Barrel.CommentItemData, { deleted: true }>["author"]>().toEqualTypeOf<null>();
    expectTypeOf<Barrel.LessonCommentsResult>().toHaveProperty("canModerate");
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(commentsFeature.slug).toBe("comments");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("comments");
    expect(manifest.name).toBe("comments");
  });

  test("limits mirror the server bounds", () => {
    expect(MIN_BODY).toBe(1);
    expect(MAX_BODY).toBe(2000);
    expect(MAX_COMMENTS_PER_USER_PER_LESSON).toBe(20);
  });

  test("copy defaults are Bahasa Indonesia; mergeCommentsCopy overrides", () => {
    expect(COMMENTS_COPY.sectionTitle).toBe("Diskusi");
    const merged = mergeCommentsCopy({ submit: "Kirim sekarang" });
    expect(merged.submit).toBe("Kirim sekarang");
    expect(merged.sectionTitle).toBe(COMMENTS_COPY.sectionTitle);
  });

  test("lib helpers behave canonically", () => {
    expect(buildThread([])).toEqual([]);
    expect(formatRelativeTime(Date.now())).toBe("baru saja");
    expect(extractCommentsError(new Error("x"))).toEqual({});
  });

  test("error mapping resolves typed codes to copy", () => {
    const copy = mergeCommentsCopy();
    expect(
      commentsErrorMessage(new ConvexError({ code: "RATE_LIMITED", message: "server msg" }), copy)
    ).toBe("server msg"); // RATE_LIMITED reuses the server message
    expect(
      commentsErrorMessage(new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }), copy)
    ).toBe(copy.errNotAuthorized);
    expect(
      commentsErrorMessage(new ConvexError({ code: "NOT_AUTHENTICATED", message: "x" }), copy)
    ).toBe(copy.errNotAuthenticated);
    expect(commentsErrorMessage(new Error("boom"), copy)).toBe(copy.errUnknown);
  });
});
