"use client";

// Kelola › Skills — authoring the prompt library.
//
// A SKILL IS A MATERI (`lessons.kind`), so nothing here is a second CRUD stack:
// the dialog is the courses slice's LessonDialog in `kind="skill"` mode, the
// writes are the same four lesson mutations, and the body is the same block
// editor every materi uses. What the console adds is the one thing a prompt
// library needs and the kelas tab does not: a list you can search by PROMPT.
//
// Two reads, because neither answers the whole question on its own:
//   · listLibrary({ kind: "skill" }) — the exact index range, with the prompt
//     preview and tags a card needs. It has no `status` (a library card is not
//     a management row).
//   · listMateriForManage — every materi row of the tenant with its status,
//     already fetched by the kelas tab's picker. Crossed by id, it is what
//     turns a card into "Draft / Terbit" without a new backend projection.
//     It is bounded (MANAGE_LIST_TAKE); past that a row simply shows no status
//     chip and its publish button stays disabled — a missing badge, never a
//     wrong one, and never a guess about what is published.
// Search swaps the first for searchSkills (title OR prompt, ≥2 chars, not
// paginated — the server caps it at 20 and says so).
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePaginatedQuery, useQuery } from "convex/react";
import { Search, Sparkles } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ConfirmDialog,
  LessonDialog,
  mergeCopy,
  useLessonMutations,
  useMateriForManage,
  type MateriStatus,
} from "@/features/courses";
import { useDebouncedValue } from "@/features/search";
import { communityHref } from "@/lib/community";
import { KelolaEmpty, KelolaSkeleton } from "./kelola-parts";
import { KelolaSkillRow, type SkillRowData } from "./kelola-skill-row";

/** Below this the server throws VALIDATION_FAILED, so it never gets asked. */
const SEARCH_FROM = 2;
const PAGE_SIZE = 20;

type DialogState = { mode: "create" } | { mode: "edit"; skill: SkillRowData } | null;

export function KelolaSkillsTab({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const copy = mergeCopy();
  const [q, setQ] = useState("");
  const term = useDebouncedValue(q, 300).trim();
  const searching = term.length >= SEARCH_FROM;

  const paged = usePaginatedQuery(
    api.features.materi.library.listLibrary,
    searching ? "skip" : { tenantId, kind: "skill" as const },
    { initialNumItems: PAGE_SIZE }
  );
  const found = useQuery(
    api.features.materi.skills.searchSkills,
    searching ? { tenantId, q: term } : "skip"
  );
  const manageRows = useMateriForManage(tenantId);
  const { setLessonStatus, deleteLesson } = useLessonMutations();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDelete, setConfirmDelete] = useState<SkillRowData | null>(null);

  const statusById = useMemo(() => {
    const map = new Map<string, MateriStatus>();
    for (const row of manageRows ?? []) map.set(row._id, row.status);
    return map;
  }, [manageRows]);

  const skills: SkillRowData[] | undefined = searching ? found : paged.results;
  const loading = searching
    ? found === undefined
    : paged.status === "LoadingFirstPage";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 @sm:flex-row @sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={copy.searchSkills}
            aria-label={copy.searchSkills}
            className="pl-9"
          />
        </div>
        <Button
          className="min-h-11 shrink-0 @sm:min-h-9"
          onClick={() => setDialog({ mode: "create" })}
        >
          <Sparkles aria-hidden /> {copy.newSkill}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {copy.skillsBlurb}{" "}
        <Link
          href={communityHref.skills(slug)}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {copy.skillsTitle}
        </Link>
      </p>

      {loading ? (
        <KelolaSkeleton lines={3} />
      ) : skills === undefined || skills.length === 0 ? (
        <KelolaEmpty
          icon={Sparkles}
          title={searching ? copy.searchSkillsEmpty : copy.emptySkillsTitle}
          body={searching ? undefined : copy.emptySkillsBody}
          action={
            searching ? undefined : (
              <Button className="min-h-11" onClick={() => setDialog({ mode: "create" })}>
                <Sparkles aria-hidden /> {copy.newSkill}
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 @3xl:grid-cols-2">
          {skills.map((skill) => (
            <li key={skill._id}>
              <KelolaSkillRow
                skill={skill}
                status={statusById.get(skill._id)}
                contentEditorHref={communityHref.kelolaMateri(slug, skill._id)}
                copy={copy}
                onEdit={() => setDialog({ mode: "edit", skill })}
                onToggleStatus={(next) =>
                  void setLessonStatus(skill._id as Id<"lessons">, next)
                }
                onDelete={() => setConfirmDelete(skill)}
              />
            </li>
          ))}
        </ul>
      )}

      {!searching && paged.status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="min-h-11 w-full @sm:min-h-9"
          onClick={() => paged.loadMore(PAGE_SIZE)}
        >
          {copy.loadMore}
        </Button>
      )}

      <LessonDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        kind="skill"
        copy={copy}
        tenantId={tenantId}
        lessonId={dialog?.mode === "edit" ? (dialog.skill._id as Id<"lessons">) : undefined}
        initialTags={dialog?.mode === "edit" ? dialog.skill.tags : []}
        contentEditorHref={
          dialog?.mode === "edit"
            ? communityHref.kelolaMateri(slug, dialog.skill._id)
            : undefined
        }
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={copy.deleteSkill}
        description={copy.deleteSkillConfirm}
        confirmLabel={copy.deleteSkill}
        cancelLabel={copy.cancel}
        onConfirm={async () => {
          if (confirmDelete === null) return;
          await deleteLesson(confirmDelete._id as Id<"lessons">);
        }}
      />
    </section>
  );
}
