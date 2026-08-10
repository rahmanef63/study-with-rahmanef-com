"use client";
// courses slice — the authoring form for ONE materi row. A SKILL is that same
// row with `kind: "skill"` and a prompt (DATA-MODEL 2026-08-10), so this form
// serves both and `kind` only decides which fields make sense:
//
//   materi → title, YouTube (paste URL → ID extracted client-side; the server
//            re-validates, P0), markdown body with a preview tab, links.
//   skill  → title, TAGS, PROMPT, and the body only while creating.
//
// Why a skill hides the video and the links: a skill is a prompt plus its
// explanation, and every field that is not that is a field an author has to
// decide to leave empty. They stay one edit away — the materi dialog still
// renders them for a materi, and the block editor owns everything else.
//
// Why the body disappears from a skill in EDIT mode (`bodyEditable={false}`):
// DECISIONS #38 — once the block editor has written `contentBlocks`, markdown
// is DERIVED and `updateLesson` refuses to patch it. A textarea that is
// sometimes authoritative and sometimes rejected is worse than no textarea, so
// editing the body is the block editor's job and this form links to it.
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoursesCopy } from "../../config/copy";
import { MAX_CONTENT_MD_CHARS } from "../../config/limits";
import { extractYoutubeVideoId } from "../../lib/youtube";
import type { CourseLink, LessonKind } from "../../types";
import { MarkdownView } from "../markdown-view";
import { LinksEditor } from "./links-editor";
import { MdTextarea } from "./md-textarea";
import { PromptField } from "./prompt-field";
import { TagsField } from "./tags-field";

export type LessonFormValues = {
  title: string;
  contentMd: string;
  /** undefined = no video; string = validated 11-char ID. */
  youtubeVideoId?: string;
  links: CourseLink[];
  /** Skill mode only — trimmed, never empty (the field is required). */
  promptText?: string;
  /** Skill mode only — already normalised by lib/tags.ts. */
  tags?: string[];
};

export type LessonFormProps = {
  initial?: LessonFormValues;
  onSubmit: (values: LessonFormValues) => void | Promise<void>;
  submitting: boolean;
  copy: CoursesCopy;
  /** Defaults to "materi" — only the skills console passes "skill". */
  kind?: LessonKind;
  /** false → the body is not rendered and `contentMd` passes through as-is. */
  bodyEditable?: boolean;
  /** Rendered above the submit row — the skills console puts the "buka editor
   *  isi" link here. A ReactNode, never a render function. */
  bodySlot?: ReactNode;
};

export function LessonForm({
  initial,
  onSubmit,
  submitting,
  copy,
  kind = "materi",
  bodyEditable = true,
  bodySlot,
}: LessonFormProps) {
  const isSkill = kind === "skill";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [videoInput, setVideoInput] = useState(initial?.youtubeVideoId ?? "");
  const [contentMd, setContentMd] = useState(initial?.contentMd ?? "");
  const [links, setLinks] = useState<CourseLink[]>(initial?.links ?? []);
  const [promptText, setPromptText] = useState(initial?.promptText ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);

  const extractedId = videoInput.trim() === "" ? null : extractYoutubeVideoId(videoInput);
  const videoInvalid = !isSkill && videoInput.trim() !== "" && extractedId === null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (videoInvalid) return; // hint already visible; server would reject too
        void onSubmit({
          title: title.trim(),
          contentMd,
          youtubeVideoId: isSkill ? initial?.youtubeVideoId : (extractedId ?? undefined),
          links: isSkill
            ? (initial?.links ?? [])
            : links.filter((l) => l.label.trim() !== "" || l.url.trim() !== ""),
          promptText: isSkill ? promptText.trim() : undefined,
          tags: isSkill ? tags : undefined,
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="lesson-title">{copy.fieldTitle}</Label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={120}
        />
      </div>

      {isSkill ? (
        <>
          <PromptField
            id="lesson-prompt"
            value={promptText}
            onChange={setPromptText}
            copy={copy}
            disabled={submitting}
          />
          <TagsField
            id="lesson-tags"
            value={tags}
            onChange={setTags}
            copy={copy}
            disabled={submitting}
          />
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lesson-video">{copy.fieldYoutube}</Label>
          <Input
            id="lesson-video"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="https://youtu.be/… atau dQw4w9WgXcQ"
            aria-invalid={videoInvalid}
          />
          <p
            className={videoInvalid ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {videoInvalid
              ? copy.fieldYoutubeHint
              : extractedId !== null
                ? `ID: ${extractedId}`
                : copy.fieldYoutubeHint}
          </p>
        </div>
      )}

      {bodyEditable && (
        <div className="space-y-2">
          <Label htmlFor="lesson-content">{isSkill ? copy.skillBody : copy.fieldContent}</Label>
          <Tabs defaultValue="tulis">
            <TabsList>
              <TabsTrigger value="tulis">Tulis</TabsTrigger>
              <TabsTrigger value="pratinjau">Pratinjau</TabsTrigger>
            </TabsList>
            <TabsContent value="tulis">
              <MdTextarea
                id="lesson-content"
                value={contentMd}
                onChange={(e) => setContentMd(e.target.value)}
                maxLength={MAX_CONTENT_MD_CHARS}
              />
            </TabsContent>
            <TabsContent value="pratinjau">
              <div className="min-h-48 border border-border p-4">
                <MarkdownView content={contentMd} />
              </div>
            </TabsContent>
          </Tabs>
          {isSkill && <p className="text-sm text-muted-foreground">{copy.skillBodyHint}</p>}
        </div>
      )}

      {!isSkill && <LinksEditor value={links} onChange={setLinks} copy={copy} />}
      {bodySlot}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || videoInvalid}
          className="min-h-11 w-full sm:min-h-9 sm:w-auto"
        >
          {submitting ? copy.saving : copy.save}
        </Button>
      </div>
    </form>
  );
}
