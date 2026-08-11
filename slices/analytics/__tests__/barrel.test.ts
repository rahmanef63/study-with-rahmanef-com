// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel (the
// shared vitest.config.mts has no `@/*`-paths alias, so a runtime import of
// ../index — whose view pulls @/features/progress + @/components/* — cannot
// resolve under vitest; the type assertions are enforced by `npx tsc
// --noEmit`). Pattern: slices/roadmap/__tests__/barrel.test.ts, which consumes
// the same progress barrel. Copy merging + error mapping ARE runtime-tested
// via alias-free relative imports; metadata pair sync (§5.4) via JSON imports.
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { ANALYTICS_COPY, mergeAnalyticsCopy } from "../config/copy";
import { analyticsErrorMessage, extractAnalyticsError } from "../lib/errors";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("analytics barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the connected view, components, hooks, lib, config, and types", () => {
    expectTypeOf<typeof Barrel.CourseAnalyticsView>().toBeFunction();
    expectTypeOf<typeof Barrel.StatCard>().toBeFunction();
    expectTypeOf<typeof Barrel.LessonCompletionBars>().toBeFunction();
    expectTypeOf<typeof Barrel.QuizStatList>().toBeFunction();
    expectTypeOf<typeof Barrel.useCourseAnalytics>().toBeFunction();
    expectTypeOf<typeof Barrel.useCourseSummaries>().toBeFunction();
    // 0.3.0 — the insight half.
    expectTypeOf<typeof Barrel.CourseFunnelView>().toBeFunction();
    expectTypeOf<typeof Barrel.TenantPulseView>().toBeFunction();
    expectTypeOf<typeof Barrel.FunnelStepList>().toBeFunction();
    expectTypeOf<typeof Barrel.PulseMateriList>().toBeFunction();
    expectTypeOf<typeof Barrel.MembersOnlyNote>().toBeFunction();
    expectTypeOf<typeof Barrel.MateriViewRecorder>().toBeFunction();
    expectTypeOf<typeof Barrel.useCourseFunnel>().toBeFunction();
    expectTypeOf<typeof Barrel.useTenantPulse>().toBeFunction();
    expectTypeOf<typeof Barrel.biggestDrop>().toBeFunction();
    expectTypeOf<typeof Barrel.funnelEnds>().toBeFunction();
    expectTypeOf<typeof Barrel.lostBefore>().toBeFunction();
    expectTypeOf<typeof Barrel.analyticsErrorMessage>().toBeFunction();
    expectTypeOf<typeof Barrel.analyticsFeature>().toMatchTypeOf<{ slug: string }>();
    expectTypeOf<Barrel.CourseAnalyticsData>().toBeObject();
    expectTypeOf<Barrel.CourseSummaryData>().toBeObject();
    expectTypeOf<Barrel.LessonCompletionStat>().toBeObject();
    expectTypeOf<Barrel.CourseQuizStat>().toBeObject();
    // MATERI MODEL (DECISIONS #37): the completion row is flat — no module
    // grouping key survives, and the quiz row is keyed to the course.
    expectTypeOf<Barrel.LessonCompletionStat>().toMatchTypeOf<{
      lessonId: unknown;
      title: string;
      order: number;
      completedCount: number;
    }>();
    expectTypeOf<Barrel.CourseQuizStat>().toMatchTypeOf<{
      quizId: unknown;
      quizTitle: string;
      passRatePct: number;
    }>();
    // The funnel step is what every drop-off component reads. `viewedCount` is
    // DISTINCT MEMBERS and `viewCount` is member-days; a rename that collapsed
    // them would silently turn re-reads into extra people.
    expectTypeOf<Barrel.FunnelStepData>().toMatchTypeOf<{
      lessonId: unknown;
      title: string;
      order: number;
      viewedCount: number;
      viewCount: number;
      completedCount: number;
      retentionPct: number;
    }>();
    expectTypeOf<Barrel.CourseFunnelData>().toMatchTypeOf<{
      memberCount: number;
      startedCount: number;
      steps: readonly Barrel.FunnelStepData[];
    }>();
    expectTypeOf<Barrel.TenantPulseData>().toMatchTypeOf<{
      memberCount: number;
      activeThisWeek: number;
      materiCount: number;
      neverReadCount: number;
      mostRead: readonly Barrel.PulseMateriData[];
      leastRead: readonly Barrel.PulseMateriData[];
    }>();
    expectTypeOf<Barrel.AnalyticsErrorCode>().toEqualTypeOf<
      "NOT_AUTHENTICATED" | "NOT_AUTHORIZED" | "NOT_FOUND" | "VALIDATION_FAILED" | "RATE_LIMITED"
    >();
  });
});

describe("copy + error mapping (runtime, alias-free imports)", () => {
  test("copy defaults are full Bahasa; override merges over defaults", () => {
    expect(ANALYTICS_COPY.statMembers).toBeTruthy();
    expect(ANALYTICS_COPY.emptyQuizzes).toBeTruthy();
    // THE CAVEAT IS PART OF THE CONTRACT (0.3.0): every reader number on this
    // screen counts logged-in members only, and the copy that says so must not
    // be quietly emptied by an override merge or a copy-tidying pass.
    expect(ANALYTICS_COPY.membersOnlyBadge).toBeTruthy();
    expect(ANALYTICS_COPY.membersOnlyNote).toMatch(/ANGGOTA/);
    expect(ANALYTICS_COPY.membersOnlyNote).toMatch(/anonim/i);
    const merged = mergeAnalyticsCopy({ statMembers: "Anggota" });
    expect(merged.statMembers).toBe("Anggota");
    expect(merged.statLessons).toBe(ANALYTICS_COPY.statLessons);
  });

  test("error mapping resolves typed codes to copy", () => {
    const err = new ConvexError({ code: "NOT_AUTHORIZED", message: "x" });
    expect(extractAnalyticsError(err)).toMatchObject({ code: "NOT_AUTHORIZED" });
    expect(analyticsErrorMessage(err, ANALYTICS_COPY)).toBe(ANALYTICS_COPY.errNotAuthorized);
    expect(analyticsErrorMessage(new Error("boom"), ANALYTICS_COPY)).toBe(
      ANALYTICS_COPY.errUnknown
    );
    const validation = new ConvexError({ code: "VALIDATION_FAILED", message: "Input salah" });
    expect(analyticsErrorMessage(validation, ANALYTICS_COPY)).toBe("Input salah");
  });
});

describe("slice metadata pair", () => {
  test("versions are in sync (audit:slices contract)", () => {
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("analytics");
    expect(manifest.name).toBe("analytics");
  });
});
