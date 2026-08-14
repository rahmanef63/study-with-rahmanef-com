"use client";
// courses slice — "tambah materi" picker. A materi belongs to the COMMUNITY,
// not to a course (DECISIONS #37), so adding one to a course is picking an
// existing materi, not authoring a new one. Authoring is still one tap away
// (`onCreateNew`), and the created materi is placed by the caller.
//
// Materi already placed in this course are filtered out here so the list can
// never offer a duplicate the server would only reject.
import { useMemo, useState } from "react";
import { PlayCircle, Plus, Search } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoursesCopy } from "../../config/copy";
import type { MateriPickerRow } from "../../types";

export type MateriPickerProps = {
  /** Every materi of the tenant (undefined = still loading). */
  materi: MateriPickerRow[] | undefined;
  /** Materi ids already placed in this course — hidden from the list. */
  placedLessonIds: ReadonlyArray<string>;
  copy: CoursesCopy;
  onPick: (lessonId: Id<"lessons">) => void;
  onCreateNew: () => void;
  disabled?: boolean;
};

export function MateriPicker({
  materi,
  placedLessonIds,
  copy,
  onPick,
  onCreateNew,
  disabled = false,
}: MateriPickerProps) {
  const [q, setQ] = useState("");
  const placed = useMemo(() => new Set(placedLessonIds), [placedLessonIds]);

  const available = useMemo(() => {
    if (materi === undefined) return [];
    const needle = q.trim().toLowerCase();
    return materi.filter(
      (row) =>
        !placed.has(row._id) && (needle === "" || row.title.toLowerCase().includes(needle))
    );
  }, [materi, placed, q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 @sm:flex-row @sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={copy.addMateriPick}
            aria-label={copy.addMateriPick}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 @sm:min-h-9"
          onClick={onCreateNew}
          disabled={disabled}
        >
          <Plus aria-hidden /> {copy.newLesson}
        </Button>
      </div>

      {materi === undefined ? (
        <Skeleton className="h-24 w-full" />
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.addMateriEmpty}</p>
      ) : (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-[var(--radius)] border border-border bg-card">
          {available.map((row) => (
            <li key={row._id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(row._id)}
                className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60"
              >
                <Plus className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{row.title}</span>
                {row.status === "draft" && (
                  <span className="shrink-0 border border-border bg-muted px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                    {copy.statusDraft}
                  </span>
                )}
                {row.hasVideo && (
                  <PlayCircle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
