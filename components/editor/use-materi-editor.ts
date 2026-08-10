"use client";

// THE ADAPTER SEAM. `EditorDataAdapter` is the slice's whole data contract:
// the editor never imports Convex, and this file never imports an editor
// component. Swap this hook and the same PageEditor runs on any backend.
//
// WHY LOCAL STATE IS THE SESSION'S SOURCE OF TRUTH. The editor's data surface
// is synchronous (`getPage` returns a Page, not a promise) and its writes are
// per-keystroke, while our storage is ONE `contentBlocks` blob on the lessons
// row. So edits land in React state instantly and a debounced whole-document
// save pushes them. The Convex query stays subscribed but seeds state EXACTLY
// ONCE per materi — re-seeding on our own write would yank the caret out of a
// sentence the author is still typing.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { uid } from "@notion/shared/lib/uid";
import type { Block, Page } from "@notion/shared/types";
import type { EditorAdapter, EditorDataAdapter } from "@notion/slices/editor";
import {
  addBlockAt, duplicateBlockAt, patchBlock, removeBlock,
  reorderBlocks, replaceBlock, setBlockType,
} from "./materi-blocks";
import { blocksForMateri, materiToPage } from "./materi-page";

/** Quiet-typing window before a save fires. Long enough that a sentence is one
 *  save, short enough that a closed tab loses at most this much. */
const SAVE_DEBOUNCE_MS = 900;

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export interface MateriEditorState {
  adapter: EditorAdapter;
  /** undefined = still loading; null = not found / not permitted. */
  page: Page | null | undefined;
  status: SaveStatus;
  /** Persist now, ignoring the debounce (⌘S, navigating away). */
  flush: () => void;
}

export function useMateriEditor(lessonId: Id<"lessons">): MateriEditorState {
  const materi = useQuery(api.features.courses.manage.getLessonForManage, { lessonId });
  const saveContent = useMutation(api.features.materi.content.saveContent);
  const updateLesson = useMutation(api.features.courses.lessons.updateLesson);

  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const seededFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the last save wrote, so a debounce that fires on unchanged content
  // (e.g. the author clicked around without typing) performs no round trip.
  const savedRef = useRef<{ blocks: string; title: string }>({ blocks: "", title: "" });
  const pageRef = useRef<Page | null | undefined>(undefined);
  pageRef.current = page;

  useEffect(() => {
    if (materi === undefined) return; // still loading
    if (materi === null) {
      setPage(null);
      return;
    }
    if (seededFor.current === materi._id) return; // never re-seed over live edits
    seededFor.current = materi._id;
    const blocks = blocksForMateri(materi);
    savedRef.current = { blocks: JSON.stringify(blocks), title: materi.title };
    setPage(materiToPage(materi, blocks));
  }, [materi]);

  const persist = useCallback(async () => {
    const current = pageRef.current;
    if (!current) return;
    const blocks = JSON.stringify(current.blocks);
    const title = current.title;
    const last = savedRef.current;
    if (blocks === last.blocks && title === last.title) {
      setStatus((s) => (s === "dirty" ? "saved" : s));
      return;
    }
    setStatus("saving");
    try {
      // Title first: `saveContent` is the only writer of contentMd, so if the
      // title write fails the body has still not been touched.
      if (title !== last.title) await updateLesson({ lessonId, title });
      if (blocks !== last.blocks) await saveContent({ lessonId, contentBlocks: blocks });
      savedRef.current = { blocks, title };
      setStatus("saved");
    } catch {
      // The local document is intact — the next edit re-arms the debounce and
      // tries again, so a transient failure is not data loss.
      setStatus("error");
    }
  }, [lessonId, saveContent, updateLesson]);

  const schedule = useCallback(() => {
    setStatus("dirty");
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), SAVE_DEBOUNCE_MS);
  }, [persist]);

  const flush = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    void persist();
  }, [persist]);

  // Last-chance save. `pagehide` (not `beforeunload`) is the event that also
  // fires when a mobile browser backgrounds the tab, which is how this app is
  // mostly used.
  useEffect(() => {
    const onHide = () => void persist();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      if (timer.current !== null) clearTimeout(timer.current);
      void persist(); // route change away from the editor
    };
  }, [persist]);

  const edit = useCallback(
    (fn: (blocks: Block[]) => Block[]) => {
      setPage((p) => (p ? { ...p, blocks: fn(p.blocks) } : p));
      schedule();
    },
    [schedule],
  );

  const data = useMemo<EditorDataAdapter>(
    () => ({
      user: { id: "", name: "", email: "", icon: "", color: "", bio: "" },
      pages: page ? [page] : [],
      getPage: (id) => (page && page.id === id ? page : undefined),
      // One materi, no page tree — the mount site hides the subpage chrome
      // rather than letting these no-ops surface as dead buttons.
      childrenOf: () => [],
      createPage: async () => ({ id: "" }),
      deletePage: async () => {},
      duplicatePage: async () => null,

      addBlock: async (_pageId, afterIndex, type, init) => {
        const id = uid();
        edit((blocks) => addBlockAt(blocks, afterIndex, id, type, init));
        return id;
      },
      updateBlock: async (_pageId, blockId, patch) => edit((b) => patchBlock(b, blockId, patch)),
      deleteBlock: async (_pageId, blockId) => edit((b) => removeBlock(b, blockId)),
      duplicateBlock: async (_pageId, blockId) => {
        const id = uid();
        edit((blocks) => duplicateBlockAt(blocks, blockId, id));
        return id;
      },
      reorderBlocks: async (_pageId, orderedIds) => edit((b) => reorderBlocks(b, orderedIds)),
      setBlockType: async (_pageId, blockId, type) => edit((b) => setBlockType(b, blockId, type)),
      replaceBlock: async (_pageId, blockId, next) => edit((b) => replaceBlock(b, blockId, next)),

      updatePage: async (_pageId, patch) => {
        setPage((p) => (p ? { ...p, ...patch } : p));
        schedule();
      },
    }),
    [page, edit, schedule],
  );

  const adapter = useMemo<EditorAdapter>(() => ({ data }), [data]);
  return { adapter, page, status, flush };
}
