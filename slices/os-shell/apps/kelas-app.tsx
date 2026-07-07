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
import { type MouseEvent } from "react";
import { BookOpen, Compass } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { type AppProps } from "@/features/appshell";
import { JoinButton, useTenantBySlug } from "@/features/tenants";
import { openApp, seg } from "./_nav";
import { CourseOverviewView, LessonPlayerView, useCourseOverview } from "@/features/courses";
import { CourseProgress, LessonCompletion, useCourseProgress } from "@/features/progress";
import { useQuizForTaking } from "@/features/quiz";
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

function KelasEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
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
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 sm:p-8">
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
  if (quiz == null) return null; // undefined (loading) or null (no quiz)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 truncate">
        <span className="font-medium">Kuis:</span> {title}
      </span>
      <span className="shrink-0 text-xs font-medium text-primary">Kerjakan →</span>
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
      <div onClickCapture={onNavCapture} className="mx-auto w-full max-w-4xl p-6 sm:p-8">
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
    <div onClickCapture={onNavCapture} className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      {isMember ? (
        <MemberOverview
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          courseSlug={courseSlug}
          courseId={overview.course._id}
        />
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
      <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
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
