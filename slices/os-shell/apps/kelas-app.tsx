"use client";
// Kelas — the OS "course + lesson" app. Reuses the courses/progress slice
// views verbatim (CourseOverviewView + LessonPlayerView + the progress slots);
// nothing about course/syllabus/lesson/markdown rendering is reimplemented
// here. The only OS-specific trick is navigation: the reused views emit Next
// <Link>s, so we hijack their clicks in the capture phase and swap the visible
// pane via internal state — a lesson opens IN THIS WINDOW, not a new one.
// A module's quiz CTA is the exception: it spawns the "kuis" app in its own
// window via openWindow. Runs inside an appshell window, so it fetches
// client-side via useQuery (root layout already mounts Convex).
import { useEffect, type MouseEvent } from "react";
import { BookOpen, Compass, GraduationCap, Share2 } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/mockup-kit";
import { type AppProps, usePublishInspector, share } from "@/features/appshell";
import { JoinButton, useTenantBySlug } from "@/features/tenants";
import { openApp, seg } from "./_nav";
import { recordRecentCourse } from "../recent-courses";
import { CourseOverviewView, LessonPlayerView, useCourseOverview } from "@/features/courses";
import { CourseProgress, LessonCompletion, useCourseProgress } from "@/features/progress";
import { useQuizForTaking, useMyAttempts } from "@/features/quiz";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// In-window nav scheme — the reused views build hrefs with these; the capture
// handler below parses them back into state instead of letting Next navigate.
const lessonHref = (id: string) => `#lesson/${id}`;
const OVERVIEW_HREF = "#overview";

// Share the course deep-link via the shell share sheet. Used by BOTH the desktop
// inspector action and the in-body button — the latter is the only share trigger
// on mobile, where no inspector renders (rightPanel is desktop-only).
function shareCourse(tenantSlug: string, courseSlug: string, title: string) {
  const url = `${window.location.origin}/kelas/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(courseSlug)}`;
  share(`${title} — ${url}`);
}

function KelasEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl p-6 @sm:p-8">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Compass aria-hidden />
          </EmptyMedia>
          <EmptyTitle className="font-serif">{title}</EmptyTitle>
          <EmptyDescription className="text-pretty">{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

function KelasSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 @sm:p-8">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Per-module quiz CTA — member-gated (useQuizForTaking throws for outsiders,
 *  so it only mounts inside the member branch). Renders only once the module
 *  actually has a published quiz. Opens the kuis app in its own window. */
function ModuleQuizEntry({
  moduleId,
  title,
  onOpen,
}: {
  moduleId: Id<"modules">;
  title: string;
  onOpen: () => void;
}) {
  const quiz = useQuizForTaking(moduleId);
  // "skip" until the quiz resolves (Rules-of-Hooks: called before the early return).
  // Member-branch only, so this never fires for anonymous viewers.
  const attempts = useMyAttempts(quiz?._id);
  if (quiz == null) return null; // undefined (loading) or null (no quiz)
  // Server stores `passed` per attempt → once ANY attempt passed, the module is lulus.
  // attempts===undefined (loading) falls through to the neutral "Kerjakan" state.
  const passed = (attempts ?? []).some((a) => a.passed);
  const attempted = (attempts ?? []).length > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-win)] border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <GraduationCap
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          aria-hidden
        />
        <span className="min-w-0 truncate">
          <span className="font-medium">Kuis:</span> {title}
        </span>
      </span>
      <span className="shrink-0">
        {passed ? (
          <Badge tone="success">Lulus ✓</Badge>
        ) : attempted ? (
          <Badge tone="muted">Belum lulus</Badge>
        ) : (
          <Badge tone="accent">Kerjakan →</Badge>
        )}
      </span>
    </button>
  );
}

/** Member overview — layers progress (ring + ticks) and the per-module quiz CTA
 *  onto the shared CourseOverviewView. Mounts only for members, so the
 *  member-gated progress query never fires for anonymous viewers. */
function MemberOverview({
  tenantId,
  tenantSlug,
  courseSlug,
  courseId,
}: {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  courseSlug: string;
  courseId: Id<"courses">;
}) {
  const progress = useCourseProgress(courseId);
  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={lessonHref}
      completedLessonIds={progress?.completedLessonIds}
      progressSlot={<CourseProgress courseId={courseId} />}
      renderModuleFooter={(m) => (
        <ModuleQuizEntry
          moduleId={m._id}
          title={m.title}
          onOpen={() => openApp("kuis", `Kuis: ${m.title}`, [tenantSlug, courseSlug, m._id])}
        />
      )}
    />
  );
}

/** Side-effect only (renders null): publishes the Kelas inspector (⌘I right
 *  panel) — course progress, the next lesson, and per-module quiz shortcuts —
 *  from data already fetched. Member-gated by its mount site, so the member-only
 *  progress query never fires for anonymous viewers. */
function KelasInspector({
  overview,
  tenantSlug,
  courseSlug,
}: {
  overview: NonNullable<ReturnType<typeof useCourseOverview>>;
  tenantSlug: string;
  courseSlug: string;
}) {
  const progress = useCourseProgress(overview.course._id);

  const ordered = overview.modules.flatMap((m) => m.lessons);
  const done = new Set(progress?.completedLessonIds ?? []);
  const next = ordered.find((l) => !done.has(l._id)) ?? null;
  const total = progress?.totalCount ?? overview.lessonCount;
  const completed = progress?.completedCount ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  usePublishInspector(
    "kelas",
    {
      subject: overview.course.title,
      props: [
        { label: "Progress", value: `${pct}%` },
        { label: "Selesai", value: `${completed}/${total} lesson` },
        { label: "Berikutnya", value: next?.title ?? "Semua selesai 🎉" },
      ],
      actions: [
        {
          id: "share-course",
          label: "Bagikan kelas",
          run: () => shareCourse(tenantSlug, courseSlug, overview.course.title),
        },
        ...(next
          ? [
              {
                id: "next-lesson",
                label: "Lanjut ke lesson berikutnya",
                run: () => {
                  openApp("kelas", "Kelas", [tenantSlug, courseSlug, "lesson", next._id]);
                },
              },
            ]
          : []),
        ...overview.modules.map((m) => ({
          id: `quiz-${m._id}`,
          label: `Kuis: ${m.title}`,
          run: () => {
            openApp("kuis", `Kuis: ${m.title}`, [tenantSlug, courseSlug, m._id]);
          },
        })),
      ],
      context: `Kelas "${overview.course.title}", ${pct}% selesai (${completed}/${total} lesson).`,
      suggestions: next
        ? [`Ringkas lesson "${next.title}"`, "Apa yang harus saya pelajari selanjutnya?"]
        : [],
    },
    [overview.course._id, tenantSlug, courseSlug, completed, total, next?._id, overview.course.title]
  );

  return null;
}

/** The course window body: overview ⇄ lesson panes, switched by internal state.
 *  Wraps both panes in a capture-phase click handler that intercepts the reused
 *  views' in-window nav links (#lesson/… and #overview) and turns them into
 *  state changes — external/markdown/YouTube links fall through untouched. */
function KelasCourse({
  tenantId,
  tenantSlug,
  courseSlug,
  lessonId,
}: {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  courseSlug: string;
  lessonId: Id<"lessons"> | null;
}) {
  const overview = useCourseOverview(tenantId, courseSlug);

  // Remember this course for Beranda's "Lanjutkan belajar" resume row. Keyed on
  // the tenant+course slug pair (bumps recency when re-opened) and only fires
  // once the overview resolves, so the title is known and drafts/NOT_FOUND
  // (overview stays undefined) never get recorded. Client-only (localStorage).
  const courseTitle = overview?.course.title;
  useEffect(() => {
    if (courseTitle) recordRecentCourse({ tenantSlug, courseSlug, title: courseTitle });
  }, [tenantSlug, courseSlug, courseTitle]);

  // Payload-driven in-window nav so lessons are deep-linkable: selecting a lesson
  // (or "back") re-opens this same window with a new path, which appshell mirrors
  // to the URL (/kelas/<t>/<c>[/lesson/<id>]) — no local state.
  const onNavCapture = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (href == null) return;
    if (href.startsWith("#lesson/")) {
      e.preventDefault();
      e.stopPropagation();
      openApp("kelas", "Kelas", [tenantSlug, courseSlug, "lesson", href.slice("#lesson/".length)]);
    } else if (href === OVERVIEW_HREF) {
      e.preventDefault();
      e.stopPropagation();
      openApp("kelas", "Kelas", [tenantSlug, courseSlug]);
    }
  };

  if (overview === undefined) return <KelasSkeleton />;
  const isMember = overview.viewerRole != null;

  // Lesson content is member-only (getLesson throws for outsiders); non-members
  // can't select a lesson anyway (locked syllabus), so gate the pane on it.
  if (lessonId !== null && isMember) {
    return (
      <div onClickCapture={onNavCapture} className="mx-auto w-full max-w-4xl p-6 @sm:p-8">
        <LessonPlayerView
          lessonId={lessonId}
          lessonHref={lessonHref}
          backHref={OVERVIEW_HREF}
          completionSlot={<LessonCompletion lessonId={lessonId} />}
        />
      </div>
    );
  }

  return (
    <div onClickCapture={onNavCapture} className="mx-auto w-full max-w-4xl p-6 @sm:p-8">
      {/* Body share trigger — on mobile the inspector (its twin) never renders, so
          without this "Bagikan kelas" would be unreachable on the phone shells. */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => shareCourse(tenantSlug, courseSlug, overview.course.title)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Share2 className="size-3.5" aria-hidden />
          Bagikan
        </button>
      </div>
      {isMember ? (
        <>
          <KelasInspector overview={overview} tenantSlug={tenantSlug} courseSlug={courseSlug} />
          <MemberOverview
            tenantId={tenantId}
            tenantSlug={tenantSlug}
            courseSlug={courseSlug}
            courseId={overview.course._id}
          />
        </>
      ) : (
        <CourseOverviewView
          tenantId={tenantId}
          courseSlug={courseSlug}
          lessonHref={lessonHref}
          joinCtaSlot={<JoinButton tenantId={tenantId} loginHref="/masuk" />}
        />
      )}
    </div>
  );
}

/** Resolves the tenant slug → id, then hands off to KelasCourse. */
function KelasWindow({
  tenantSlug,
  courseSlug,
  lessonId,
}: {
  tenantSlug: string;
  courseSlug: string;
  lessonId: Id<"lessons"> | null;
}) {
  const tenant = useTenantBySlug(tenantSlug);

  if (tenant === undefined) return <KelasSkeleton />;
  if (tenant === null) {
    return (
      <KelasEmpty
        title="Komunitas tidak ditemukan"
        description="Kelas ini mungkin sudah dipindahkan atau komunitasnya tidak lagi aktif."
      />
    );
  }

  return (
    <KelasCourse
      tenantId={tenant._id}
      tenantSlug={tenantSlug}
      courseSlug={courseSlug}
      lessonId={lessonId}
    />
  );
}

export default function KelasApp(props: AppProps) {
  // Deep-link path: /kelas/<tenantSlug>/<courseSlug>
  const segs = seg(props.payload);
  const [tenantSlug, courseSlug] = segs;
  const lessonId = segs[2] === "lesson" && segs[3] ? (segs[3] as Id<"lessons">) : null;

  if (!tenantSlug || !courseSlug) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6 @sm:p-8">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Belum ada kelas dipilih</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Buka sebuah kelas dari Beranda untuk mulai belajar 🌱
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return <KelasWindow tenantSlug={tenantSlug} courseSlug={courseSlug} lessonId={lessonId} />;
}
