"use client";
// courses slice — inline "add module" row for the course editor.
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CoursesCopy } from "../../config/copy";

export type AddModuleFormProps = {
  courseId: Id<"courses">;
  onCreate: (courseId: Id<"courses">, title: string) => Promise<unknown | null>;
  copy: CoursesCopy;
};

export function AddModuleForm({ courseId, onCreate, copy }: AddModuleFormProps) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const created = await onCreate(courseId, title.trim());
        if (created !== null) setTitle("");
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={copy.newModule}
        minLength={3}
        maxLength={120}
        required
      />
      <Button type="submit" variant="outline">
        <Plus aria-hidden /> {copy.newModule}
      </Button>
    </form>
  );
}
