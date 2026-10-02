// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { CourseProgressBar } from "../components/course-progress-bar";
import { CourseProgress } from "../views/course-progress";

vi.mock("../hooks/use-course-progress", () => ({ useCourseProgress: () => ({
  completedLessonIds: [], completedCount: 10, totalCount: 10, isComplete: false, truncated: true,
}) }));

test("progress has a readable name and count for assistive technology", () => {
  const html = renderToStaticMarkup(<CourseProgressBar completedCount={2} totalCount={5} isComplete={false} />);
  expect(html).toContain('aria-label="Progres kelas"');
  expect(html).toContain('aria-valuenow="40"');
  expect(html).toContain('aria-valuetext="2/5 materi selesai"');
});

test.each([0, 10])("partial progress with %i known lessons never claims exact completion", (totalCount) => {
  const html = renderToStaticMarkup(<CourseProgressBar completedCount={totalCount}
    totalCount={totalCount} isComplete truncated />);
  expect(html).toContain('role="status"');
  expect(html).toContain("Sebagian progres belum dapat ditampilkan");
  expect(html).not.toMatch(/progressbar|Kelas selesai|Belum ada materi/);
});

test("the connected progress view carries the server's partial-data signal", () => {
  const html = renderToStaticMarkup(<CourseProgress courseId={"course" as Id<"courses">} />);
  expect(html).toContain("Sebagian progres belum dapat ditampilkan");
  expect(html).not.toContain("progressbar");
});
