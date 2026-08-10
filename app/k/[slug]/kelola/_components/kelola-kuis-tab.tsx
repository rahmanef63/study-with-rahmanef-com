"use client";

// Kelola › Kuis — quiz studio, two levels deep: kelas → kuis → builder.
//
// MATERI MODEL (DECISIONS #37): a quiz belongs to the COURSE, not to a module,
// and a course may hold several. The old middle step ("pilih modul") is gone;
// what replaces it is the course's own quiz LIST, which is also the only place
// a second quiz can be created. QuizBuilderView owns every create/edit/delete
// write (server-authorized); nothing is reimplemented here.
import { useState } from "react";
import { BookOpen, ListChecks, Plus } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/mockup-kit";
import { useManageCourses } from "@/features/courses";
import { QuizBuilderView, useQuizzesForCourse } from "@/features/quiz";
import { KelolaBack, KelolaEmpty, KelolaRow, KelolaSkeleton } from "./kelola-parts";

/** null = the list; { quizId: undefined } = create a new quiz in this course. */
type BuilderState = { quizId?: Id<"quizzes"> } | null;

export function KelolaKuisTab({ tenantId }: { tenantId: Id<"tenants"> }) {
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);
  const [builder, setBuilder] = useState<BuilderState>(null);

  if (courseId === null) {
    return (
      <CoursePicker
        tenantId={tenantId}
        onSelect={(id) => {
          setBuilder(null);
          setCourseId(id);
        }}
      />
    );
  }

  if (builder === null) {
    return (
      <QuizPicker
        courseId={courseId}
        onBack={() => setCourseId(null)}
        onSelect={(quizId) => setBuilder({ quizId })}
        onCreate={() => setBuilder({})}
      />
    );
  }

  return (
    <div className="space-y-4">
      <KelolaBack label="Semua kuis kelas ini" onClick={() => setBuilder(null)} />
      <QuizBuilderView
        courseId={courseId}
        quizId={builder.quizId}
        // Create returns the new id, delete returns null — either way the list
        // is the honest next screen, so it is where both land.
        onSaved={(quizId) => setBuilder(quizId === null ? null : { quizId })}
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
      <SectionHeader
        eyebrow="Studio kuis"
        title="Pilih kelas"
        as="h3"
        actions={
          <span className="text-sm text-muted-foreground">Kuis dikelola per kelas.</span>
        }
      />
      <ul className="grid gap-2 @2xl:grid-cols-2">
        {courses.map((course) => (
          <li key={course._id}>
            <KelolaRow
              icon={BookOpen}
              label={course.title}
              onClick={() => onSelect(course._id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuizPicker({
  courseId,
  onBack,
  onSelect,
  onCreate,
}: {
  courseId: Id<"courses">;
  onBack: () => void;
  onSelect: (quizId: Id<"quizzes">) => void;
  onCreate: () => void;
}) {
  const quizzes = useQuizzesForCourse(courseId);
  return (
    <section className="space-y-4">
      <KelolaBack label="Pilih kelas lain" onClick={onBack} />
      <SectionHeader
        eyebrow="Kuis"
        title="Kuis di kelas ini"
        as="h3"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 shrink-0 @sm:min-h-9"
            onClick={onCreate}
          >
            <Plus aria-hidden /> Kuis baru
          </Button>
        }
      />
      {quizzes === undefined ? (
        <KelolaSkeleton lines={2} />
      ) : quizzes.length === 0 ? (
        <KelolaEmpty
          icon={ListChecks}
          title="Belum ada kuis"
          body="Satu kelas boleh punya beberapa kuis. Mulai dari satu, tambah lagi kapan pun."
          action={
            <Button className="min-h-11" onClick={onCreate}>
              <Plus aria-hidden /> Kuis baru
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-2 @2xl:grid-cols-2">
          {quizzes.map((quiz) => (
            <li key={quiz._id}>
              <KelolaRow
                icon={ListChecks}
                label={quiz.title}
                meta={`${quiz.questionCount} soal · lulus di ${quiz.passingScorePct}%`}
                onClick={() => onSelect(quiz._id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
