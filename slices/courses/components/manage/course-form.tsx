"use client";
// courses slice — course create/edit fields (title, slug, description,
// cover URL). Slug auto-derives from the title until manually edited.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoursesCopy } from "../../config/copy";
import { COURSE_SLUG_PATTERN } from "../../config/limits";
import { MdTextarea } from "./md-textarea";

export type CourseFormValues = {
  title: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
};

export type CourseFormProps = {
  initial?: CourseFormValues;
  onSubmit: (values: CourseFormValues) => void | Promise<void>;
  submitting: boolean;
  copy: CoursesCopy;
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function CourseForm({ initial, onSubmit, submitting, copy }: CourseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(initial !== undefined);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({
          title: title.trim(),
          slug,
          description: description.trim(),
          coverImageUrl: coverImageUrl.trim() === "" ? undefined : coverImageUrl.trim(),
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="course-title">{copy.fieldTitle}</Label>
        <Input
          id="course-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          minLength={3}
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-slug">{copy.fieldSlug}</Label>
        <Input
          id="course-slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          required
          pattern={COURSE_SLUG_PATTERN}
          minLength={3}
          maxLength={64}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-description">{copy.fieldDescription}</Label>
        <MdTextarea
          id="course-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={2000}
          className="min-h-24 font-sans"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-cover">{copy.fieldCover}</Label>
        <Input
          id="course-cover"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          type="url"
          placeholder="https://"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? copy.saving : copy.save}
        </Button>
      </div>
    </form>
  );
}
