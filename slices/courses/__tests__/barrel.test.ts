// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel,
// RUNTIME against the alias-free modules.
//
// Why type-level for the barrel: the shared vitest.config.mts has no
// `@/*` alias resolution yet, so a runtime import of ../index (which pulls
// component files importing @/components/ui/*) cannot resolve under
// vitest. `import type` is erased at runtime; the assertions below are
// enforced by `npx tsc --noEmit` (DoD §5.1) instead.
// TODO(rr): waiting on integrator — add tsconfig-path aliases to
// vitest.config.mts (proposal in gamma's final report), then switch this
// file to a value import of "../index" and assert with typeof checks.
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { COURSES_COPY, mergeCopy } from "../config/copy";
import { MAX_PROMPT_CHARS, MAX_TAGS_PER_LESSON } from "../config/limits";
import { coursesErrorMessage } from "../lib/errors";
import { parseTagInput } from "../lib/tags";
import { extractYoutubeVideoId } from "../lib/youtube";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the consumer-facing components, views, hooks, lib and types", () => {
    // components (progress #3 + landing #5 seams)
    expectTypeOf<typeof Barrel.CourseCard>().toBeFunction();
    expectTypeOf<typeof Barrel.CourseOverview>().toBeFunction();
    expectTypeOf<typeof Barrel.SyllabusList>().toBeFunction();
    expectTypeOf<typeof Barrel.LessonView>().toBeFunction();
    expectTypeOf<typeof Barrel.MarkdownView>().toBeFunction();
    expectTypeOf<typeof Barrel.YoutubeEmbed>().toBeFunction();
    // route views (integrator mounts)
    expectTypeOf<typeof Barrel.CourseCatalog>().toBeFunction();
    expectTypeOf<typeof Barrel.CourseOverviewView>().toBeFunction();
    expectTypeOf<typeof Barrel.LessonPlayerView>().toBeFunction();
    expectTypeOf<typeof Barrel.ManageCoursesView>().toBeFunction();
    expectTypeOf<typeof Barrel.ManageCourseEditorView>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.usePublishedCourses>().toBeFunction();
    expectTypeOf<typeof Barrel.useLesson>().toBeFunction();
    expectTypeOf<typeof Barrel.useCourseMutations>().toBeFunction();
    expectTypeOf<typeof Barrel.useLessonMutations>().toBeFunction();
    // progress (#3) consumes these shapes:
    expectTypeOf<Barrel.LessonViewData>().toHaveProperty("contentMd");
    expectTypeOf<Barrel.LessonViewData>().toHaveProperty("nextLessonId");
    expectTypeOf<Barrel.CourseCardData>().toHaveProperty("slug");
    // MATERI MODEL (DECISIONS #37): the silabus is FLAT — the overview carries
    // `lessons`, never `modules`, and a syllabus row is a materi.
    expectTypeOf<Barrel.CourseOverviewData>().toHaveProperty("lessons");
    expectTypeOf<Barrel.SyllabusLessonData>().toHaveProperty("slug");
    expectTypeOf<Barrel.SyllabusListProps>().toHaveProperty("lessons");
    // the editor works on PLACEMENTS, not on a tree
    expectTypeOf<Barrel.CourseManageData>().toHaveProperty("lessons");
    expectTypeOf<Barrel.ManagePlacementRow>().toHaveProperty("placementId");
    expectTypeOf<typeof Barrel.usePlacementMutations>().toBeFunction();
    // completion seam: SyllabusList accepts completedLessonIds
    expectTypeOf<Barrel.SyllabusListProps>().toHaveProperty("completedLessonIds");
    expectTypeOf<Barrel.LessonViewProps>().toHaveProperty("completionSlot");
    // SKILLS (2026-08-10): a skill is a `lessons` row with kind "skill" + a
    // prompt, so the console composes it from THESE manage primitives instead
    // of cloning the materi authoring UI. The kelola console is the consumer.
    expectTypeOf<typeof Barrel.LessonDialog>().toBeFunction();
    expectTypeOf<typeof Barrel.ConfirmDialog>().toBeFunction();
    expectTypeOf<typeof Barrel.PromptField>().toBeFunction();
    expectTypeOf<Barrel.LessonDialogProps>().toHaveProperty("kind");
    expectTypeOf<Barrel.LessonDialogProps>().toHaveProperty("initialTags");
    expectTypeOf<Barrel.LessonKind>().toEqualTypeOf<"materi" | "skill">();
    // the prompt rides the SAME two mutations a materi does — no skill CRUD
    expectTypeOf<Barrel.CreateLessonInput>().toHaveProperty("promptText");
    expectTypeOf<Barrel.UpdateLessonInput>().toHaveProperty("promptText");
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("copy defaults are Bahasa Indonesia and mergeCopy overrides", () => {
    expect(COURSES_COPY.save).toBe("Simpan");
    expect(mergeCopy({ save: "Simpan!" }).save).toBe("Simpan!");
    expect(mergeCopy().cancel).toBe("Batal");
  });

  test("coursesErrorMessage maps typed codes to user copy", () => {
    const copy = mergeCopy();
    expect(
      coursesErrorMessage(new ConvexError({ code: "NOT_AUTHENTICATED", message: "x" }), copy)
    ).toBe(copy.errNotAuthenticated);
    expect(
      coursesErrorMessage(new ConvexError({ code: "NOT_AUTHORIZED", message: "x" }), copy)
    ).toBe(copy.errNotAuthorized);
    expect(
      coursesErrorMessage(
        new ConvexError({ code: "VALIDATION_FAILED", message: "Pesan server" }),
        copy
      )
    ).toBe("Pesan server");
    expect(coursesErrorMessage(new Error("random"), copy)).toBe(copy.errUnknown);
  });

  test("pure lib functions are live through their modules", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseTagInput("Prompt Engineering!, ai", MAX_TAGS_PER_LESSON)).toEqual([
      "prompt-engineering",
      "ai",
    ]);
  });

  test("skill copy names the kind — an author never reads 'materi baru'", () => {
    expect(COURSES_COPY.newSkill).toBe("Skill baru");
    expect(COURSES_COPY.editSkill).toBe("Ubah skill");
    expect(COURSES_COPY.skillLabel).toBe("Skill");
  });

  test("the UI prompt cap mirrors the server's assertPromptText bound", () => {
    expect(MAX_PROMPT_CHARS).toBe(4_000);
    expect(MAX_TAGS_PER_LESSON).toBe(12);
  });
});
