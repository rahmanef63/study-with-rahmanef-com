"use client";
// courses slice — lesson editor form: title, YouTube (paste URL → ID
// extracted client-side; server re-validates, P0), markdown with live
// preview tab, resource links. Submits null youtubeVideoId to clear.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CoursesCopy } from "../../config/copy";
import { MAX_CONTENT_MD_CHARS } from "../../config/limits";
import { extractYoutubeVideoId } from "../../lib/youtube";
import type { CourseLink } from "../../types";
import { MarkdownView } from "../markdown-view";
import { LinksEditor } from "./links-editor";
import { MdTextarea } from "./md-textarea";

export type LessonFormValues = {
  title: string;
  contentMd: string;
  /** undefined = no video; string = validated 11-char ID. */
  youtubeVideoId?: string;
  links: CourseLink[];
};

export type LessonFormProps = {
  initial?: LessonFormValues;
  onSubmit: (values: LessonFormValues) => void | Promise<void>;
  submitting: boolean;
  copy: CoursesCopy;
};

export function LessonForm({ initial, onSubmit, submitting, copy }: LessonFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [videoInput, setVideoInput] = useState(initial?.youtubeVideoId ?? "");
  const [contentMd, setContentMd] = useState(initial?.contentMd ?? "");
  const [links, setLinks] = useState<CourseLink[]>(initial?.links ?? []);

  const extractedId = videoInput.trim() === "" ? null : extractYoutubeVideoId(videoInput);
  const videoInvalid = videoInput.trim() !== "" && extractedId === null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (videoInvalid) return; // hint already visible; server would reject too
        void onSubmit({
          title: title.trim(),
          contentMd,
          youtubeVideoId: extractedId ?? undefined,
          links: links.filter((l) => l.label.trim() !== "" || l.url.trim() !== ""),
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

      <div className="space-y-2">
        <Label htmlFor="lesson-video">{copy.fieldYoutube}</Label>
        <Input
          id="lesson-video"
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          placeholder="https://youtu.be/… atau dQw4w9WgXcQ"
          aria-invalid={videoInvalid}
        />
        <p className={videoInvalid ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {videoInvalid ? copy.fieldYoutubeHint : extractedId !== null ? `ID: ${extractedId}` : copy.fieldYoutubeHint}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lesson-content">{copy.fieldContent}</Label>
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
            <div className="min-h-48 rounded-md border border-border p-4">
              <MarkdownView content={contentMd} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LinksEditor value={links} onChange={setLinks} copy={copy} />

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || videoInvalid}>
          {submitting ? copy.saving : copy.save}
        </Button>
      </div>
    </form>
  );
}
