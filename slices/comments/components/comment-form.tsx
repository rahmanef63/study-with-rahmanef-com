"use client";
// comments slice — comment/reply form. Client validation is UX only; the
// mutation re-validates (P0). Reused for the root composer and inline replies
// (compact + cancel button).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_BODY, MIN_BODY } from "../config/limits";
import type { CommentsCopy } from "../config/copy";
import { Textarea } from "./textarea";

export type CommentFormProps = {
  /** Resolves true on success — the form clears itself and calls onDone. */
  onSubmit: (bodyMd: string) => Promise<boolean>;
  submitting: boolean;
  copy: CommentsCopy;
  placeholder?: string;
  /** Compact inline variant (reply): smaller area + cancel button. */
  compact?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function CommentForm({
  onSubmit,
  submitting,
  copy,
  placeholder,
  compact = false,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState("");
  const canSubmit = body.trim().length >= MIN_BODY && body.trim().length <= MAX_BODY && !submitting;

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const ok = await onSubmit(body.trim());
        if (ok) {
          setBody("");
          onCancel?.();
        }
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_BODY}
        placeholder={placeholder ?? copy.bodyPlaceholder}
        aria-label={copy.fieldBody}
        autoFocus={autoFocus}
        className={compact ? "min-h-16" : "min-h-24"}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {body.trim().length}/{MAX_BODY}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {copy.cancel}
            </Button>
          )}
          <Button type="submit" size={compact ? "sm" : "default"} disabled={!canSubmit}>
            {submitting ? copy.submitting : copy.submit}
          </Button>
        </div>
      </div>
    </form>
  );
}
