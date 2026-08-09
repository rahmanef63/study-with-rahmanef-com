"use client";
// posts slice — the member-only composer.
//
// NO FILE UPLOAD: attachments are an explicit PRD non-goal. A post is markdown
// plus, optionally, ONE http(s) link and ONE YouTube id — both re-validated
// server-side (convex/features/posts/validate.ts).
//
// `canAnnounce` hides the "Pengumuman" option for a plain member. That is UX
// only: posts.create re-checks instructor+ for that kind (P0), so flipping the
// select in devtools still fails on the server.
import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergePostsCopy, type PostsCopyOverride } from "../config/copy";
import { MAX_BODY, MAX_TITLE, MAX_URL, MIN_BODY, MIN_TITLE } from "../config/limits";
import { POST_KINDS, postKindLabel } from "../lib/kind";
import type { PostKind } from "../types";
import { Textarea } from "./textarea";

export type PostComposerValues = {
  kind: PostKind;
  title: string;
  bodyMd: string;
  linkUrl?: string;
  youtubeVideoId?: string;
};

export type PostComposerProps = {
  /** Resolves true on success — the form clears itself. */
  onSubmit: (values: PostComposerValues) => Promise<boolean>;
  submitting: boolean;
  /** Viewer is instructor+ — may pick "pengumuman". */
  canAnnounce: boolean;
  copy?: PostsCopyOverride;
};

const FIELD = "space-y-1.5";

export function PostComposer({ onSubmit, submitting, canAnnounce, copy: copyOverride }: PostComposerProps) {
  const copy = mergePostsCopy(copyOverride);
  // Instance-scoped so two composers on one page cannot produce duplicate
  // ids and silently bind both <Label htmlFor> to the first one.
  const fieldId = useId();
  const [kind, setKind] = useState<PostKind>("diskusi");
  const [title, setTitle] = useState("");
  const [bodyMd, setBody] = useState("");
  const [linkUrl, setLink] = useState("");
  const [youtubeVideoId, setVideo] = useState("");

  const kinds = POST_KINDS.filter((k) => k !== "pengumuman" || canAnnounce);
  const canSubmit =
    !submitting &&
    title.trim().length >= MIN_TITLE &&
    title.trim().length <= MAX_TITLE &&
    bodyMd.trim().length >= MIN_BODY &&
    bodyMd.trim().length <= MAX_BODY;

  return (
    <form
      className="space-y-4 border-2 border-border bg-card p-4 shadow-[3px_3px_0_0_var(--pixel-shadow)]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const ok = await onSubmit({
          kind,
          title: title.trim(),
          bodyMd: bodyMd.trim(),
          linkUrl: linkUrl.trim() || undefined,
          youtubeVideoId: youtubeVideoId.trim() || undefined,
        });
        if (ok) {
          setTitle("");
          setBody("");
          setLink("");
          setVideo("");
        }
      }}
    >
      <div className="space-y-1">
        <h3 className="font-display text-xs uppercase tracking-wide">{copy.composerTitle}</h3>
        <p className="text-xs text-muted-foreground">{copy.composerHint}</p>
      </div>

      <div className={FIELD}>
        <span className="eyebrow text-[10px]">{copy.fieldKind}</span>
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={
                kind === k
                  ? "pixel-press border-2 border-primary bg-primary px-3 py-1 text-xs uppercase tracking-wide text-primary-foreground"
                  : "pixel-press border-2 border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
              }
            >
              {postKindLabel(k, copy)}
            </button>
          ))}
        </div>
      </div>

      <div className={FIELD}>
        <Label htmlFor={`${fieldId}-title`}>{copy.fieldTitle}</Label>
        <Input
          id={`${fieldId}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE}
          placeholder={copy.titlePlaceholder}
          required
        />
      </div>

      <div className={FIELD}>
        <Label htmlFor={`${fieldId}-body`}>{copy.fieldBody}</Label>
        <Textarea
          id={`${fieldId}-body`}
          value={bodyMd}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_BODY}
          placeholder={copy.bodyPlaceholder}
          className="min-h-28"
        />
        <span className="block text-right text-[11px] tabular-nums text-muted-foreground">
          {bodyMd.trim().length}/{MAX_BODY}
        </span>
      </div>

      <div className="grid gap-3 @md:grid-cols-2">
        <div className={FIELD}>
          <Label htmlFor={`${fieldId}-link`}>{copy.fieldLink}</Label>
          <Input
            id={`${fieldId}-link`}
            type="url"
            inputMode="url"
            value={linkUrl}
            onChange={(e) => setLink(e.target.value)}
            maxLength={MAX_URL}
            placeholder={copy.linkPlaceholder}
          />
        </div>
        <div className={FIELD}>
          <Label htmlFor={`${fieldId}-video`}>{copy.fieldVideo}</Label>
          <Input
            id={`${fieldId}-video`}
            value={youtubeVideoId}
            onChange={(e) => setVideo(e.target.value)}
            maxLength={11}
            placeholder={copy.videoPlaceholder}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
