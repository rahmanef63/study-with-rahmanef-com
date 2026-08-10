"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_COMMENTS,
  type AiAdapter,
  type CommentsAdapter,
  type EditorAdapter,
  type SelectionAdapter,
} from "./adapter";
import { NOOP_DATA_ADAPTER, type EditorDataAdapter } from "./dataAdapter";

/**
 * React context carrying the host's {@link EditorAdapter}. Defaults to `{}`
 * so any editor subtree renders standalone (uploads/comments/database/etc.
 * simply absent). The host wraps its editor in <EditorAdapterProvider> to
 * light up capabilities. This is the runtime half of the decoupling seam.
 */
const EditorAdapterContext = createContext<EditorAdapter>({});

export function EditorAdapterProvider({
  adapter,
  children,
}: {
  adapter: EditorAdapter;
  children: ReactNode;
}) {
  return (
    <EditorAdapterContext.Provider value={adapter}>
      {children}
    </EditorAdapterContext.Provider>
  );
}

export function useEditorAdapter(): EditorAdapter {
  return useContext(EditorAdapterContext);
}

/** Block + page CRUD. Falls back to a no-op layer when the host supplies none,
 *  so editing chrome renders inert instead of throwing. */
export function useEditorData(): EditorDataAdapter {
  return useContext(EditorAdapterContext).data ?? NOOP_DATA_ADAPTER;
}

/** Multi-block selection, or undefined when the host wires none (chrome then
 *  skips its selection affordances). */
export function useSelection(): SelectionAdapter | undefined {
  return useContext(EditorAdapterContext).selection;
}

/** Comments adapter — always defined (no-op DEFAULT_COMMENTS when the host
 *  wires none) so block chrome can call useBlockComments unconditionally. */
export function useComments(): CommentsAdapter {
  return useContext(EditorAdapterContext).comments ?? DEFAULT_COMMENTS;
}

/** Inline "Ask AI" panel adapter, or undefined when the host wires none. */
export function useAi(): AiAdapter | undefined {
  return useContext(EditorAdapterContext).ai;
}
