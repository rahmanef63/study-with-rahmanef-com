"use client";

// Desktop syllabus sidebar for the lesson player (UI-UX-PRD §4 player). Uses
// the public getOverview (published courses) + member-gated progress for the
// completed ticks — no backend change. Hidden on mobile via the caller.
import Link from "next/link";
import { Check } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useCourseOverview } from "@/features/courses";
import { useCourseProgress } from "@/features/progress";
import { useTenantBySlug } from "@/features/tenants";

export function LessonSyllabusAside({
  slug,
  courseSlug,
  currentLessonId,
  className,
}: {
  slug: string;
  courseSlug: string;
  currentLessonId: Id<"lessons">;
  className?: string;
}) {
  const tenant = useTenantBySlug(slug);
  const overview = useCourseOverview(tenant?._id, courseSlug);
  // Progress is member-gated (throws for outsiders) — only query once the
  // public overview confirms the viewer is a member.
  const isMember = overview?.viewerRole != null;
  const progress = useCourseProgress(isMember ? overview?.course._id : undefined);
  const completed = new Set(progress?.completedLessonIds ?? []);

  if (!overview) return null;

  return (
    <aside className={cn("self-start lg:sticky lg:top-6", className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Silabus
      </p>
      <nav className="space-y-4 text-sm">
        {overview.modules.map((m) => (
          <div key={m._id}>
            <p className="mb-1 font-medium">{m.title}</p>
            <ul className="space-y-0.5">
              {m.lessons.map((l) => {
                const active = l._id === currentLessonId;
                const done = completed.has(l._id);
                return (
                  <li key={l._id}>
                    <Link
                      href={`/t/${slug}/kelas/${courseSlug}/belajar/${l._id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        active
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Check
                        aria-hidden
                        className={cn("size-3.5 shrink-0", done ? "text-primary" : "text-transparent")}
                      />
                      <span className="truncate">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
