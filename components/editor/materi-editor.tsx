"use client";

// The mount site: `<PageEditor>` inside `<EditorAdapterProvider>`, plus the one
// piece of chrome this app owns — a save indicator.
//
// This module is the ONLY thing that pulls the block editor (and @dnd-kit) into
// a bundle, and it is reached exclusively through `materi-editor-loader.tsx`'s
// `next/dynamic({ ssr: false })`. Never import it directly from a page.

import { useEffect } from "react";
import { EditorAdapterProvider, PageEditor } from "@notion/slices/editor";
import type { Id } from "@convex/_generated/dataModel";
import { useMateriEditor, type SaveStatus } from "./use-materi-editor";

const LABEL: Record<SaveStatus, string> = {
  idle: "Tersimpan",
  dirty: "Belum tersimpan",
  saving: "Menyimpan…",
  saved: "Tersimpan",
  error: "Gagal menyimpan — perubahan masih ada di layar",
};

export function MateriEditor({ lessonId }: { lessonId: Id<"lessons"> }) {
  const { adapter, page, status, flush } = useMateriEditor(lessonId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flush]);

  if (page === undefined) {
    return <p className="p-6 text-sm text-muted-foreground">Memuat editor…</p>;
  }
  if (page === null) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Materi tidak ditemukan, atau kamu bukan pengajar di komunitas ini.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border px-4 py-2">
        <span className="font-display text-[10px] uppercase tracking-wide">Editor materi</span>
        <span
          aria-live="polite"
          className={
            status === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {LABEL[status]}
        </span>
      </div>
      <EditorAdapterProvider adapter={adapter}>
        {/* Page-level chrome is off: favorite, font/width/lock, duplicate,
            move-to-trash and subpages all write Page fields that a `lessons`
            row has no column for, so they could never persist. */}
        <PageEditor
          pageId={page.id}
          showHeader={false}
          showSubpages={false}
          className="min-h-0 flex-1"
        />
      </EditorAdapterProvider>
    </div>
  );
}
