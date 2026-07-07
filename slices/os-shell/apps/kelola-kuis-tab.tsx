"use client";
// Kelola › Kuis tab — quiz builder per module. Quizzes are keyed to a module,
// so this drills course → module → the real QuizBuilderView (which owns every
// quiz create/edit/delete write, server-authorized). The course/module lists
// are read-only selectors built on the courses read hooks; no CRUD here.
import { useState } from "react";
import { ArrowLeft, ChevronRight, ListChecks } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useCourseTree, useManageCourses } from "@/features/courses";
import { QuizBuilderView } from "@/features/quiz";
import { KelolaEmpty, KelolaSkeleton } from "./kelola-parts";

const rowClass =
  "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const backButtonClass = "-ml-2 min-h-11 text-muted-foreground sm:min-h-9";

export function KelolaKuisTab({ tenantId }: { tenantId: Id<"tenants"> }) {
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);
  const [moduleId, setModuleId] = useState<Id<"modules"> | null>(null);

  if (courseId === null) {
    return (
      <CoursePicker
        tenantId={tenantId}
        onSelect={(id) => {
          setModuleId(null);
          setCourseId(id);
        }}
      />
    );
  }

  if (moduleId === null) {
    return (
      <ModulePicker courseId={courseId} onBack={() => setCourseId(null)} onSelect={setModuleId} />
    );
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className={backButtonClass}
        onClick={() => setModuleId(null)}
      >
        <ArrowLeft aria-hidden /> Pilih modul lain
      </Button>
      <QuizBuilderView
        moduleId={moduleId}
        courseId={courseId}
        tenantId={tenantId}
        onDeleted={() => setModuleId(null)}
      />
    </div>
  );
}

function CoursePicker({
  tenantId,
  onSelect,
}: {
  tenantId: Id<"tenants">;
  onSelect: (id: Id<"courses">) => void;
}) {
  const courses = useManageCourses(tenantId);
  if (courses === undefined) return <KelolaSkeleton />;
  if (courses.length === 0) {
    return (
      <KelolaEmpty
        icon={ListChecks}
        title="Belum ada kelas"
        body="Buat kelas dulu di tab Kelas sebelum menyusun kuis."
      />
    );
  }
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <span className="eyebrow">Studio kuis</span>
        <h2 className="font-serif text-2xl">Pilih kelas</h2>
        <p className="text-pretty text-sm text-muted-foreground">
          Kuis dikelola per modul. Pilih kelasnya dulu.
        </p>
      </div>
      <ul className="space-y-2">
        {courses.map((course) => (
          <li key={course._id}>
            <button type="button" onClick={() => onSelect(course._id)} className={rowClass}>
              <span className="min-w-0 truncate font-serif text-base font-medium">
                {course.title}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ModulePicker({
  courseId,
  onBack,
  onSelect,
}: {
  courseId: Id<"courses">;
  onBack: () => void;
  onSelect: (id: Id<"modules">) => void;
}) {
  const tree = useCourseTree(courseId);
  if (tree === undefined) return <KelolaSkeleton />;
  return (
    <section className="space-y-4">
      <Button variant="ghost" size="sm" className={backButtonClass} onClick={onBack}>
        <ArrowLeft aria-hidden /> Pilih kelas lain
      </Button>
      <div className="min-w-0 space-y-1">
        <span className="eyebrow">Kuis</span>
        <h2 className="truncate font-serif text-2xl">{tree.course.title}</h2>
        <p className="text-pretty text-sm text-muted-foreground">Pilih modul untuk menyusun kuisnya.</p>
      </div>
      {tree.modules.length === 0 ? (
        <KelolaEmpty
          icon={ListChecks}
          title="Belum ada modul"
          body="Tambahkan modul di editor kelas dulu, lalu susun kuisnya di sini."
        />
      ) : (
        <ul className="space-y-2">
          {tree.modules.map((mod) => (
            <li key={mod._id}>
              <button type="button" onClick={() => onSelect(mod._id)} className={rowClass}>
                <span className="min-w-0 truncate text-sm">{mod.title}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
