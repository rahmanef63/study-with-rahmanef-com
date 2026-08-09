// Pure unit specs for the deep-link href builders (one behavior cluster).
import { describe, expect, test } from "vitest";
import { buildCourseHref, buildLessonHref, hitHref } from "../lib/hrefs";
import type { LessonHit, SearchHit } from "../types";

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

    const lesson = {
      kind: "lesson",
      title: "Materi 1",
      courseSlug: "dasar-ai",
      lessonId: "j57abc",
      snippet: "…",
    } as unknown as LessonHit; // Id<"lessons"> is a branded string
    expect(hitHref("belajar-ai", lesson)).toBe("/k/belajar-ai/kelas/dasar-ai/j57abc");
  });

  test("resource href is the EXTERNAL url as-is — tenantSlug never applied (#29)", () => {
    const resource: SearchHit = {
      kind: "resource",
      title: "Panduan Prompt",
      url: "https://contoh.id/panduan?ref=1",
    };
    expect(hitHref("belajar-ai", resource)).toBe("https://contoh.id/panduan?ref=1");
  });
});
