// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { CourseOverview } from "../components/course-overview";
import { SyllabusList } from "../components/syllabus-list";
import { LessonView } from "../components/lesson-view";
import { CourseOverviewView } from "../views/course-overview-view";
import { LessonPlayerView } from "../views/lesson-player-view";
import type { CourseOverviewData, LessonViewData } from "../types";

vi.mock("../components/markdown-view", () => ({ MarkdownView: () => null }));
const reads = vi.hoisted(() => ({ overview: undefined as CourseOverviewData | undefined,
  lesson: undefined as LessonViewData | undefined, error: null as Error | null }));
vi.mock("../hooks/use-courses", () => ({
  useCourseOverview: () => { if (reads.error) throw reads.error; return reads.overview; },
  useLesson: () => { if (reads.error) throw reads.error; return reads.lesson; },
}));

const lessons = ["awal", "lanjut"].map((id, order) => ({
  _id: id as Id<"lessons">, title: id, slug: id, order, hasVideo: false,
}));
const overview: CourseOverviewData = {
  course: { _id: "course" as Id<"courses">, tenantId: "tenant" as Id<"tenants">,
    slug: "ai", title: "Belajar AI", description: "Materi", status: "published" },
  lessons, lessonCount: 2, viewerRole: "member",
};
const lessonHref = (id: string) => `/materi/${id}`;

describe("course learning actions", () => {
  test.each([
    [[], "Mulai belajar", "awal"],
    [["awal"], "Lanjutkan belajar", "lanjut"],
    [["lanjut"], "Lanjutkan belajar", "awal"],
    [["awal", "lanjut"], "Pelajari ulang", "awal"],
    [["unrelated"], "Mulai belajar", "awal"],
  ])("targets the next published lesson for %j", (completed, label, target) => {
    const html = renderToStaticMarkup(<CourseOverview overview={overview} isMember
      completedLessonIds={completed as string[]} lessonHref={lessonHref} />);
    expect(html).toMatch(new RegExp(`href="/materi/${target}"[^>]*>${label}`));
  });

  test("does not start before membership and progress are known or for an empty course", () => {
    for (const props of [
      { isMember: false, completedLessonIds: [], overview },
      { isMember: true, overview },
      { isMember: true, completedLessonIds: [], overview: { ...overview, lessons: [], lessonCount: 0 } },
    ]) {
      const html = renderToStaticMarkup(<CourseOverview {...props} lessonHref={lessonHref} />);
      expect(html).not.toMatch(/Mulai belajar|Lanjutkan belajar|Pelajari ulang/);
    }
  });

  test("quiz-only courses keep quiz rows inside a list", () => {
    const html = renderToStaticMarkup(<SyllabusList lessons={[]} lessonHref={lessonHref}
      emptyText="Belum ada materi" footerSlot={<li>Kuis</li>} />);
    expect(html).toMatch(/<ol[^>]*><li>Kuis<\/li><\/ol>/);
  });

  test("completion state is available without relying on icons", () => {
    const html = renderToStaticMarkup(<SyllabusList lessons={lessons} lessonHref={lessonHref}
      emptyText="Kosong" completedLessonIds={["awal"]} />);
    expect(html).toContain('class="sr-only"> — Selesai');
    expect(html).toContain('class="sr-only"> — Belum selesai');
  });

  test("unknown progress does not announce an incorrect completion state", () => {
    const html = renderToStaticMarkup(<SyllabusList lessons={lessons} lessonHref={lessonHref}
      emptyText="Kosong" />);
    expect(html).not.toMatch(/Selesai|Belum selesai/);
    expect(html).toContain('href="/materi/awal"');
  });

  test("the last lesson offers a return action after its content", () => {
    const lesson: LessonViewData = { ...lessons[1], tenantId: overview.course.tenantId,
      contentMd: "Materi", links: [], status: "published", courseId: overview.course._id,
      courseSlug: "ai", courseTitle: "Belajar AI", prevLessonId: lessons[0]._id,
      nextLessonId: null, viewerRole: "member" };
    const html = renderToStaticMarkup(<LessonView lesson={lesson} lessonHref={lessonHref} backHref="/kelas/ai" />);
    const footer = html.slice(html.indexOf("<nav"));
    expect(footer).toMatch(/href="\/kelas\/ai"[^>]*>Kembali ke kelas/);
    expect(footer).toContain('href="/materi/awal"');
    const embedded = renderToStaticMarkup(<LessonView lesson={{ ...lesson, nextLessonId: lessons[0]._id }}
      lessonHref={lessonHref} backHref="/kelas/ai" showBackLink={false} />);
    expect(embedded).not.toContain("Kembali ke kelas");
    expect(embedded).toContain("Berikutnya");
  });
});

describe("connected learner rendering contract", () => {
  test("the anonymous overview offers joining while keeping material links locked", () => {
    reads.overview = { ...overview, viewerRole: null };
    const html = renderToStaticMarkup(<CourseOverviewView tenantId={overview.course.tenantId}
      courseSlug="ai" lessonHref={lessonHref} joinCtaSlot={<span>Gabung komunitas</span>} />);
    expect(html).toContain("Gabung komunitas");
    expect(html).not.toContain('href="/materi/');
    expect(html).not.toContain("Mulai belajar");
  });

  test("a member receives material links and the progress-aware primary action", () => {
    reads.overview = overview;
    const html = renderToStaticMarkup(<CourseOverviewView tenantId={overview.course.tenantId}
      courseSlug="ai" lessonHref={lessonHref} completedLessonIds={["awal"]}
      joinCtaSlot={<span>Gabung komunitas</span>} />);
    expect(html).toMatch(/href="\/materi\/lanjut"[^>]*>Lanjutkan belajar/);
    expect(html).not.toContain("Gabung komunitas");
  });

  test("loading reads stay in placeholders without offering stale actions", () => {
    reads.overview = undefined;
    reads.lesson = undefined;
    const html = renderToStaticMarkup(<><CourseOverviewView tenantId={overview.course.tenantId}
      courseSlug="ai" lessonHref={lessonHref} />
      <LessonPlayerView lessonId={lessons[0]._id} lessonHref={lessonHref} backHref="/kelas/ai" /></>);
    expect(html).toContain('data-slot="skeleton"');
    expect(html).not.toMatch(/<h1|href="\/materi\/|Mulai belajar/);
  });

  test("missing protected content reaches the host error boundary", () => {
    reads.error = new Error("NOT_FOUND");
    try {
      expect(() => renderToStaticMarkup(<CourseOverviewView tenantId={overview.course.tenantId}
        courseSlug="missing" lessonHref={lessonHref} />)).toThrow("NOT_FOUND");
      expect(() => renderToStaticMarkup(<LessonPlayerView lessonId={lessons[0]._id}
        lessonHref={lessonHref} backHref="/kelas/ai" />)).toThrow("NOT_FOUND");
    } finally { reads.error = null; }
  });
});
