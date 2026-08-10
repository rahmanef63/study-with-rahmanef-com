// Pure unit specs for the deep-link href builders (one behavior cluster).
import { describe, expect, test } from "vitest";
import {
  buildCourseHref,
  buildLessonHref,
  buildMateriHref,
  buildPostHref,
  hitHref,
} from "../lib/hrefs";
import type { LessonHit, PostHit, SearchHit } from "../types";

describe("href builders", () => {
  test("course href follows /k/<tenant>/kelas/<course>", () => {
    expect(buildCourseHref("belajar-ai", "dasar-ai")).toBe("/k/belajar-ai/kelas/dasar-ai");
  });

  test("lesson href follows /k/<tenant>/kelas/<course>/<lessonId>", () => {
    expect(buildLessonHref("belajar-ai", "dasar-ai", "j57abc")).toBe(
      "/k/belajar-ai/kelas/dasar-ai/j57abc"
    );
  });

  test("hitHref dispatches on the kind discriminator", () => {
    const course: SearchHit = { kind: "course", title: "Dasar AI", courseSlug: "dasar-ai" };
    expect(hitHref("belajar-ai", course)).toBe("/k/belajar-ai/kelas/dasar-ai");

    // A materi hit resolves to the CANONICAL slug URL, never a course path.
    const lesson = {
      kind: "lesson",
      title: "Materi 1",
      lessonSlug: "materi-1",
      lessonId: "j57abc",
      snippet: "…",
    } as unknown as LessonHit; // Id<"lessons"> is a branded string
    expect(hitHref("belajar-ai", lesson)).toBe("/k/belajar-ai/materi/materi-1");
  });

  test("materi href is the canonical /k/<tenant>/materi/<lessonSlug>", () => {
    expect(buildMateriHref("belajar-ai", "dasar-prompt")).toBe(
      "/k/belajar-ai/materi/dasar-prompt"
    );
  });

  test("post href is the INTERNAL permalink /k/<tenant>/post/<postId> (#33)", () => {
    expect(buildPostHref("belajar-ai", "j97xyz")).toBe("/k/belajar-ai/post/j97xyz");
    const post = {
      kind: "post",
      title: "Panduan Prompt",
      postId: "j97xyz",
      postKind: "sumber",
    } as unknown as PostHit; // Id<"posts"> is a branded string
    expect(hitHref("belajar-ai", post)).toBe("/k/belajar-ai/post/j97xyz");
  });
});
