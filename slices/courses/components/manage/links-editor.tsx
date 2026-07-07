"use client";
// courses slice — dynamic label+URL rows for lesson resource links.
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_LINKS_PER_LESSON } from "../../config/limits";
import type { CoursesCopy } from "../../config/copy";
import type { CourseLink } from "../../types";

export type LinksEditorProps = {
  value: CourseLink[];
  onChange: (links: CourseLink[]) => void;
  copy: CoursesCopy;
};

export function LinksEditor({ value, onChange, copy }: LinksEditorProps) {
  const setRow = (index: number, patch: Partial<CourseLink>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{copy.fieldLinks}</span>
      {value.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={row.label}
            onChange={(e) => setRow(i, { label: e.target.value })}
            placeholder={copy.linkLabel}
            maxLength={100}
            className="sm:w-1/3"
          />
          <div className="flex items-center gap-2">
            <Input
              value={row.url}
              onChange={(e) => setRow(i, { url: e.target.value })}
              placeholder="https://"
              type="url"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 sm:size-9"
              aria-label={`${copy.linkLabel} ${i + 1} — hapus`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>
      ))}
      {value.length < MAX_LINKS_PER_LESSON && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 sm:min-h-8"
          onClick={() => onChange([...value, { label: "", url: "" }])}
        >
          <Plus aria-hidden /> {copy.addLink}
        </Button>
      )}
    </div>
  );
}
