"use client";

// Per-module quiz CTA in the Silabus — ported from the OS Kelas app; the
// openWindow call became a route link. Member-gated: useQuizForTaking throws for
// outsiders, so this only ever mounts inside the member branch of the silabus.
// Renders nothing until the module actually has a published quiz.
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/mockup-kit";
import { useMyAttempts, useQuizForTaking } from "@/features/quiz";

export function ModuleQuizEntry({
  moduleId,
  title,
  href,
}: {
  moduleId: Id<"modules">;
  title: string;
  href: string;
}) {
  const quiz = useQuizForTaking(moduleId);
  // "skip" until the quiz resolves (Rules-of-Hooks: called before the early return).
  const attempts = useMyAttempts(quiz?._id);
  if (quiz == null) return null; // undefined (loading) or null (no quiz)
  // Server stores `passed` per attempt → once ANY attempt passed, the module is lulus.
  // attempts===undefined (loading) falls through to the neutral "Kerjakan" state.
  const passed = (attempts ?? []).some((a) => a.passed);
  const attempted = (attempts ?? []).length > 0;
  return (
    <Link
      href={href}
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
    </Link>
  );
}
