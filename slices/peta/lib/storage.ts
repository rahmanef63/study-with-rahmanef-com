// The localStorage mirror.
//
// WHY IT EXISTS: the assessment is anonymous by law (DECISIONS #34 — it is a
// pure function, never a model call, and never behind a login). That means the
// only place a half-finished run can live is the visitor's own browser. A
// phone call, a tab switch or an accidental Back must not cost them nine
// answers, because the second attempt never happens.
//
// Every entry point is try/caught: Safari private mode throws on `setItem`,
// and a storage failure must degrade to "this session only", never to a crash
// on the one page built for strangers.
import type { PetaDraft } from "@/lib/peta";
import { sanitizeDraft, sanitizeSwipe, type SwipeVerdicts } from "./sanitize";

/** Bump the suffix to invalidate every stored run at once. */
export const PETA_STORAGE_KEY = "peta.run.v1";

export type StoredRun = { draft: PetaDraft; swipe: SwipeVerdicts };

const EMPTY: StoredRun = { draft: {}, swipe: {} };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage disabled by policy — treat as "no memory"
  }
}

export function loadRun(): StoredRun {
  const store = storage();
  if (store === null) return EMPTY;
  try {
    const raw = store.getItem(PETA_STORAGE_KEY);
    if (raw === null) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    const source = parsed as { draft?: unknown; swipe?: unknown };
    return { draft: sanitizeDraft(source?.draft), swipe: sanitizeSwipe(source?.swipe) };
  } catch {
    return EMPTY; // corrupt JSON is the same decision as no JSON
  }
}

export function saveRun(run: StoredRun): void {
  const store = storage();
  if (store === null) return;
  try {
    store.setItem(PETA_STORAGE_KEY, JSON.stringify(run));
  } catch {
    // Quota or private mode. The run stays correct in React state.
  }
}

export function clearRun(): void {
  const store = storage();
  if (store === null) return;
  try {
    store.removeItem(PETA_STORAGE_KEY);
  } catch {
    // ignore
  }
}
