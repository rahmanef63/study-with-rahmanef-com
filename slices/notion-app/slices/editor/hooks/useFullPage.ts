"use client";

// Ported from notion-page-clone editor/hooks/useFullPage.ts. SEAM: the source
// subscribed to a single full page via the app store (useNotionAdapter().pages
// .useOne). rr re-expresses this against useEditorData().getPage — the seam's
// getPage returns the full Page (blocks included), and the host adapter owns
// reactivity, so the editor surfaces keep the same stable hook name without
// learning the store API.
import type { Page } from "@notion/shared/types";
import { useEditorData } from "@notion/slices/editor/lib/adapterContext";

export function useFullPage(id: string | null | undefined): Page | null | undefined {
  const { getPage } = useEditorData();
  return id ? getPage(id) : null;
}
