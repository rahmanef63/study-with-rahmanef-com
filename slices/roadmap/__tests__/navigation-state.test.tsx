// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseOverviewData } from "@/features/courses";
import type { CourseProgressData } from "@/features/progress";
import { CourseNav } from "../components/roadmap-nav";

const reads = vi.hoisted(() => ({ overview: undefined as CourseOverviewData | undefined,
  progress: undefined as CourseProgressData | undefined }));
vi.mock("@/features/courses", () => ({ useCourseOverview: () => reads.overview }));
vi.mock("@/features/progress", () => ({ useCourseProgress: () => reads.progress,
  toPercent: (done: number, total: number) => total ? done / total * 100 : 0 }));

const tenantId = "tenant" as Id<"tenants">;
function render() {
  return renderToStaticMarkup(<CourseNav tenantId={tenantId} courseSlug="ai"
    currentLessonId="one" lessonHref={(id) => `/lessons/${id}`} />);
}
beforeEach(() => {
  reads.overview = { course: { _id: "course" as Id<"courses">, tenantId, slug: "ai",
    title: "Belajar AI", description: "", status: "published" }, lessonCount: 2,
    viewerRole: "member", lessons: ["one", "two"].map((id, order) => ({
      _id: id as Id<"lessons">, title: id, slug: id, order, hasVideo: false,
    })) };
  reads.progress = undefined;
});

describe("syllabus progress certainty", () => {
  test("loading does not invent zero completion or a next lesson", () => {
    const html = render();
    expect(html).toContain("Memuat kemajuan");
    expect(html).not.toMatch(/0\/2 selesai|progressbar|Materi berikutnya/);
    expect(html).toContain('href="/lessons/two"');
  });
  test("truncated data preserves known completions without claiming exact counts", () => {
    reads.progress = { completedCount: 1, totalCount: 2, completedLessonIds: ["one" as Id<"lessons">], isComplete: false, truncated: true };
    const html = render();
    expect(html).toContain("Kemajuan belum lengkap");
    expect(html).toContain(" — Selesai");
    expect(html).not.toMatch(/1\/2 selesai|progressbar|Materi berikutnya/);
  });
  test("complete data announces counts and one next lesson", () => {
    reads.progress = { completedCount: 1, totalCount: 2, completedLessonIds: ["one" as Id<"lessons">], isComplete: false };
    const html = render();
    expect(html).toContain("1/2 selesai");
    expect(html).toContain('aria-label="Kemajuan kelas"');
    expect(html.match(/Materi berikutnya/g)).toHaveLength(1);
    expect(html).not.toContain("Kembali");
    expect(html).toContain('aria-current="page"');
  });
  test("non-members get locked rows without personal progress", () => {
    reads.overview!.viewerRole = null;
    const html = render();
    expect(html).not.toMatch(/href="\/lessons|Memuat kemajuan|progressbar/);
    expect(html.match(/ — Terkunci/g)).toHaveLength(2);
  });
});
