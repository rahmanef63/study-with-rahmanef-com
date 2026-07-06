"use client";
// announcements slice — create form (presentational; the view wires the
// mutation). Shown only to instructor+ (the view gates on canManage; the real
// guard is the server authz on create). Resets on a successful submit.
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { mergeAnnouncementsCopy, type AnnouncementsCopyOverride } from "../config/copy";
import type { CreateAnnouncementValues } from "../types";
import { UiTextarea } from "./ui-textarea";

export type AnnouncementFormProps = {
  /** Returns a truthy result on success (form resets), null on failure. */
  onSubmit: (values: CreateAnnouncementValues) => Promise<unknown> | void;
  isPending?: boolean;
  copy?: AnnouncementsCopyOverride;
  className?: string;
};

export function AnnouncementForm({ onSubmit, isPending, copy, className }: AnnouncementFormProps) {
  const t = mergeAnnouncementsCopy(copy);
  const [title, setTitle] = useState("");
  const [bodyMd, setBodyMd] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({ title, bodyMd });
    if (result) {
      setTitle("");
      setBodyMd("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="announcement-title">{t.titleLabel}</Label>
        <Input
          id="announcement-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          disabled={isPending}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="announcement-body">{t.bodyLabel}</Label>
        <UiTextarea
          id="announcement-body"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder={t.bodyPlaceholder}
          disabled={isPending}
          rows={4}
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
