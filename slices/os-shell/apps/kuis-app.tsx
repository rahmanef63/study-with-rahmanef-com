"use client";
// Kuis — the OS quiz-taking app. A thin appshell-window wrapper around the quiz
// slice's QuizTakeView (member-gated + server-graded in its own query/mutation;
// do NOT reimplement quiz logic here). Renders inside a window, so it reads
// client-side via useQuery (the root layout already mounts Convex).
//
// Payload carries the community + course slugs (so we can offer "kembali ke
// kelas" back into the Kelas app) and the Convex module id the quiz keys off —
// getQuizForTaking / QuizTakeView both key on Id<"modules">, not a slug.
import { useQuery } from "convex/react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { openWindow, type AppProps } from "@/features/appshell";
import { QuizTakeView } from "@/features/quiz";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type KuisPayload = { tenantSlug: string; courseSlug: string; moduleId: string };

export default function KuisApp(props: AppProps) {
  const payload = props.payload as KuisPayload | undefined;

  // Resolve komunitas → kelas so the header + "kembali ke kelas" window carry
  // real names. getOverview needs a tenantId, so the tenant lookup gates it
  // ("skip" until the slug resolves — idiomatic chained Convex reads).
  const tenant = useQuery(
    api.features.tenants.queries.getPublicBySlug,
    payload ? { slug: payload.tenantSlug } : "skip",
  );
  const overview = useQuery(
    api.features.courses.queries.getOverview,
    payload && tenant
      ? { tenantId: tenant._id, courseSlug: payload.courseSlug }
      : "skip",
  );

  // Invalid/absent payload (opened outside the Kelas flow): friendly empty state.
  if (!payload?.moduleId) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestion aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Kuis belum bisa dibuka</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Buka kuis lewat halaman kelasnya biar modulnya kebaca dulu.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const courseTitle = overview?.course.title;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-8">
      <header className="space-y-2">
        <button
          type="button"
          onClick={() =>
            openWindow("kelas", courseTitle ?? "Kelas", undefined, {
              tenantSlug: payload.tenantSlug,
              courseSlug: payload.courseSlug,
            })
          }
          className="-ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden /> Kembali ke kelas
        </button>
        <div className="min-w-0 space-y-1">
          <span className="eyebrow">
            {tenant?.name ? `${tenant.name} · Kuis` : "Kuis modul"}
          </span>
          {courseTitle ? (
            <h1 className="truncate font-serif text-2xl text-pretty sm:text-3xl">
              {courseTitle}
            </h1>
          ) : null}
        </div>
      </header>

      {/* Reuse the quiz slice view — it owns getQuizForTaking / listMyAttempts
          reads, submitAttempt grading, its own skeleton/no-quiz states, and the
          sticky safe-area submit bar. */}
      <QuizTakeView moduleId={payload.moduleId as Id<"modules">} />
    </div>
  );
}
