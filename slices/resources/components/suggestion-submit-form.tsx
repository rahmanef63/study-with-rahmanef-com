"use client";
// resources slice — suggestion submit form (title + optional detail). Client
// validation is UX; the mutation re-validates (P0).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResourcesCopy } from "../config/copy";
import { MAX_DETAIL, MAX_TITLE, MIN_TITLE } from "../config/limits";
import { Textarea } from "./textarea";

export type SuggestionSubmitValues = { title: string; detail?: string };

export type SuggestionSubmitFormProps = {
  // Return value is ignored (fire-and-forget); a void return type still accepts
  // a Promise-returning handler.
  onSubmit: (values: SuggestionSubmitValues) => void;
  submitting: boolean;
  copy: ResourcesCopy;
};

export function SuggestionSubmitForm({ onSubmit, submitting, copy }: SuggestionSubmitFormProps) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  const canSubmit = title.trim().length >= MIN_TITLE && !submitting;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          title: title.trim(),
          detail: detail.trim() === "" ? undefined : detail.trim(),
        });
        setTitle("");
        setDetail("");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="suggestion-title">{copy.fieldSuggestionTitle}</Label>
        <Input
          id="suggestion-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={MIN_TITLE}
          maxLength={MAX_TITLE}
          placeholder={copy.suggestionTitlePlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="suggestion-detail">{copy.fieldDetail}</Label>
        <Textarea
          id="suggestion-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={MAX_DETAIL}
          placeholder={copy.detailPlaceholder}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit} className="min-h-11 w-full px-5 sm:w-auto">
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
