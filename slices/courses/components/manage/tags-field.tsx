"use client";
// courses slice — tag input for the authoring forms. Tags are what the
// library filters on, so they are part of authoring, not an afterthought.
//
// Chips + one text field: type, then Enter or comma commits. Blur commits too —
// an author who types a tag and reaches for "Simpan" means that tag, and
// silently dropping it is the kind of loss you only notice a week later.
// Everything is normalised through lib/tags.ts on the way in, so the chip shown
// is exactly the row the server will store.
import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoursesCopy } from "../../config/copy";
import { MAX_TAGS_PER_LESSON } from "../../config/limits";
import { parseTagInput } from "../../lib/tags";

export type TagsFieldProps = {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  copy: CoursesCopy;
  max?: number;
  disabled?: boolean;
};

export function TagsField({
  id,
  value,
  onChange,
  copy,
  max = MAX_TAGS_PER_LESSON,
  disabled = false,
}: TagsFieldProps) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  const commit = (raw: string) => {
    if (raw.trim() === "") return;
    // Re-parsing the WHOLE list keeps dedupe and the cap in one place.
    onChange(parseTagInput([...value, raw].join(","), max));
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id}>{copy.fieldTags}</Label>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {value.length} / {max}
        </span>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="inline-flex min-h-8 items-center gap-1.5 border border-border bg-muted px-2 text-xs text-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-mono">{tag}</span>
                <X className="size-3" aria-hidden />
                <span className="sr-only">{copy.removeTag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Input
        id={id}
        value={draft}
        disabled={disabled || full}
        onChange={(e) => {
          // A pasted "a, b, c" commits everything but the tail in one go.
          if (e.target.value.includes(",")) {
            const parts = e.target.value.split(",");
            commit(parts.slice(0, -1).join(","));
            setDraft(parts[parts.length - 1] ?? "");
            return;
          }
          setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault(); // Enter adds a tag here; it never submits the form
          commit(draft);
        }}
        onBlur={() => commit(draft)}
        placeholder={full ? copy.fieldTagsFull : copy.fieldTagsPlaceholder}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-pretty text-sm text-muted-foreground">
        {copy.fieldTagsHint}
      </p>
    </div>
  );
}
