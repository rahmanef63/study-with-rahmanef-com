"use client";
// resources slice — submit form (title, url, note). Client validation is UX;
// the mutation re-validates every field (P0). Uses shadcn Input/Button/Label +
// the slice-local Textarea.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResourcesCopy } from "../config/copy";
import { HTTP_URL_PATTERN, MAX_NOTE, MAX_TITLE, MIN_TITLE } from "../config/limits";
import { isHttpUrl } from "../lib/url";
import { Textarea } from "./textarea";

export type ResourceSubmitValues = { title: string; url: string; note?: string };

export type ResourceSubmitFormProps = {
  // Return value is ignored (fire-and-forget); a void return type still accepts
  // a Promise-returning handler.
  onSubmit: (values: ResourceSubmitValues) => void;
  submitting: boolean;
  copy: ResourcesCopy;
};

export function ResourceSubmitForm({ onSubmit, submitting, copy }: ResourceSubmitFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const canSubmit = title.trim().length >= MIN_TITLE && isHttpUrl(url) && !submitting;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          title: title.trim(),
          url: url.trim(),
          note: note.trim() === "" ? undefined : note.trim(),
        });
        setTitle("");
        setUrl("");
        setNote("");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="resource-title">{copy.fieldTitle}</Label>
        <Input
          id="resource-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={MIN_TITLE}
          maxLength={MAX_TITLE}
          placeholder={copy.titlePlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-url">{copy.fieldUrl}</Label>
        <Input
          id="resource-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required
          pattern={HTTP_URL_PATTERN}
          placeholder={copy.urlPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resource-note">{copy.fieldNote}</Label>
        <Textarea
          id="resource-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE}
          placeholder={copy.notePlaceholder}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
