// Barrel API contract test (DoD §5.3) + metadata pair version sync (§5.4).
// Consumers (courses seams for row #3, badge wall row #9) rely on exactly these
// exports.
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import * as barrel from "../index";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("progress barrel contract", () => {
  test("presentational components are exported", () => {
    expect(typeof barrel.CourseProgressBar).toBe("function");
    expect(typeof barrel.CompletionButton).toBe("function");
  });

  test("connected views (courses slot fillers) are exported", () => {
    expect(typeof barrel.CourseProgress).toBe("function");
    expect(typeof barrel.LessonCompletion).toBe("function");
  });

  test("hooks are exported", () => {
    expect(typeof barrel.useCourseProgress).toBe("function");
    expect(typeof barrel.useLessonCompletion).toBe("function");
    expect(typeof barrel.useMarkLessonComplete).toBe("function");
  });

  test("lib helpers are exported and behave canonically", () => {
    expect(barrel.toPercent(1, 2)).toBe(50);
    expect(barrel.toPercent(0, 0)).toBe(0);
    expect(typeof barrel.progressErrorMessage).toBe("function");
    expect(typeof barrel.extractProgressError).toBe("function");
  });

  test("config + copy are exported with full Bahasa copy", () => {
    expect(barrel.progressFeature.slug).toBe("progress");
    expect(barrel.PROGRESS_COPY.markComplete).toBeTruthy();
    // Override merges over defaults; untouched keys survive.
    const merged = barrel.mergeProgressCopy({ markComplete: "Selesaikan" });
    expect(merged.markComplete).toBe("Selesaikan");
    expect(merged.completed).toBe(barrel.PROGRESS_COPY.completed);
  });

  test("error mapping resolves typed codes to copy", () => {
    const msg = barrel.progressErrorMessage(
      new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }),
      barrel.PROGRESS_COPY
    );
    expect(msg).toBe(barrel.PROGRESS_COPY.errNotAuthorized);
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("progress");
    expect(manifest.name).toBe("progress");
  });
});
