"use client";

// The editor route's header strip: WHICH KIND am I editing, and — if it is a
// skill — its prompt.
//
// Why the prompt sits HERE and not inside the block editor: DECISIONS #38. The
// editor owns `contentBlocks` and derives `contentMd` from it; `promptText` is
// a separate column written by `lessons.updateLesson`. Two owners, two saves,
// no shared field — so an autosave from the editor can never clobber a prompt
// the author is mid-way through, and saving the prompt never re-derives a body.
//
// It reads `materi.skills.getPrompt` (member+, by id) rather than
// `getLessonForManage`, which does not project promptText. One id-keyed query.
import { useState } from "react";
import { useQuery } from "convex/react";
import { FileText, Sparkles } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mergeCopy, PromptField, useLessonMutations } from "@/features/courses";

export function SkillPromptPanel({ lessonId }: { lessonId: string }) {
  const copy = mergeCopy();
  const id = lessonId as Id<"lessons">;
  const data = useQuery(api.features.materi.skills.getPrompt, { lessonId: id });
  const { updateLesson } = useLessonMutations();
  // null = "showing the server's value"; a string = the author has typed.
  // Same rule as the editor: a live query must never yank text out from under
  // a caret, so it seeds the field and then stops being the source of truth.
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (data === undefined) return <Skeleton className="h-11 w-full" />;

  const stored = data.promptText ?? "";
  const value = draft ?? stored;
  const dirty = draft !== null && draft.trim() !== stored;

  if (data.kind !== "skill") {
    return (
      <Badge icon={FileText} tone="muted">
        {copy.materiLabel}
      </Badge>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const result = await updateLesson({ lessonId: id, promptText: value.trim() });
      if (result !== null) setDraft(null); // fall back to the reactive value
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="border border-border bg-card" open={stored === ""}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm">
        <Badge icon={Sparkles} tone="primary">
          {copy.skillLabel}
        </Badge>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {stored === "" ? copy.skillNoPrompt : copy.fieldPrompt}
        </span>
        {dirty && <span className="shrink-0 text-xs text-destructive">•</span>}
      </summary>
      <div className="space-y-3 border-t border-border p-4">
        <PromptField
          id="skill-prompt"
          value={value}
          onChange={setDraft}
          copy={copy}
          disabled={saving}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            className="min-h-11 w-full sm:min-h-9 sm:w-auto"
            disabled={saving || !dirty || value.trim() === ""}
            onClick={() => void save()}
          >
            {saving ? copy.saving : copy.save}
          </Button>
        </div>
      </div>
    </details>
  );
}

function Badge({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Sparkles;
  tone: "primary" | "muted";
  children: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${
        tone === "primary"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="size-3" aria-hidden /> {children}
    </span>
  );
}
