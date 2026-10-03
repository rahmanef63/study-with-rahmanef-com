import { createRoot } from "react-dom/client";
import { BookOpen, MessageSquare, Home, List } from "lucide-react";
import { Toaster } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { AppShell } from "../../components/shell/app-shell";
import { DockBar } from "../../components/shell/dock-bar";
import { Button } from "../../components/ui/button";
import { LessonReaderLayout } from "../../app/k/[slug]/kelas/_components/lesson-reader-layout";
import { CourseNav } from "../../slices/roadmap/components/roadmap-nav";
import { LessonView } from "../../slices/courses/components/lesson-view";
import { LessonComments } from "../../slices/comments/views/lesson-comments";
import { QuizTakeView } from "../../slices/quiz/views/quiz-take-view";
import { CompletionButton } from "../../slices/progress/components/completion-button";
import { FixtureProvider } from "./convex-adapter";
import { lessonFor, tenantId, quiz } from "./data";
import { navigate, useFixtureParams } from "./next-adapter";
import "../../app/globals.css";

function ReaderFixture() {
  const params = useFixtureParams();
  const lessonId = params.get("lesson") ?? "lesson-1";
  const link = (id: string) => { const next = new URLSearchParams(params); next.set("lesson", id); next.delete("mode"); return `?${next}`; };
  const mode = (value: string) => { const next = new URLSearchParams(params); next.set("mode", value); return `?${next}`; };
  const courseHref = mode("course");
  const rail = <div className="space-y-4 p-4"><p className="font-semibold">Reader fixture lokal</p><p className="text-xs text-muted-foreground">Data uji terpisah. Tidak ada koneksi Convex atau sesi produksi.</p><Button variant="outline" onClick={() => navigate(link("lesson-2"))}>Ganti materi lokal</Button><Button variant="outline" onClick={() => navigate(mode("quiz"))}>Buka kuis lokal</Button></div>;
  const dock = <DockBar label="Navigasi cepat" cells={[
    { key: "home", label: "Beranda", href: courseHref, icon: Home, active: false },
    { key: "kelas", label: "Kelas", href: link("lesson-1"), icon: BookOpen, active: true },
    { key: "diskusi", label: "Diskusi", href: "#diskusi", icon: MessageSquare, active: false },
    { key: "menu", label: "Menu", href: courseHref, icon: List, active: false },
  ]} />;
  return <AppShell rail={rail} topBar={<div className="sticky top-0 z-30 border-b bg-card p-4 md:hidden">Reader fixture lokal</div>} dock={dock}>
    {params.get("mode") === "quiz" ? <QuizTakeView quizId={quiz._id} backHref={link(lessonId)} /> :
      params.get("mode") === "course" ? <div><h1>Kelas lokal</h1><Button onClick={() => navigate(link("lesson-1"))}>Buka materi</Button></div> :
      <LessonReaderLayout key={lessonId} courseHref={courseHref} syllabus={<CourseNav tenantId={tenantId} courseSlug="fixture" lessonHref={link} currentLessonId={lessonId} />}>
        <LessonView lesson={lessonFor(lessonId)} lessonHref={link} backHref={courseHref} showBackLink={false} completionSlot={<CompletionButton isCompleted={false} isPending={false} onComplete={() => undefined} />} />
        <section id="diskusi" className="mt-8 border-t pt-6"><LessonComments lessonId={lessonId as Id<"lessons">} /></section>
      </LessonReaderLayout>}
    <Toaster />
  </AppShell>;
}

createRoot(document.getElementById("root")!).render(<FixtureProvider><ReaderFixture /></FixtureProvider>);
