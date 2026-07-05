export type LoadingKind =
  | "text"
  | "card"
  | "list"
  | "table"
  | "form"
  | "page"
  | "block";

export interface LoadingPreset {
  /** Default repeat count for kinds that render rows/lines. */
  count: number;
}

/** kind → default {count}. `count` is overridable via props. */
export const LOADING_PRESETS: Record<LoadingKind, LoadingPreset> = {
  text: { count: 3 },
  card: { count: 1 },
  list: { count: 4 },
  table: { count: 5 },
  form: { count: 3 },
  page: { count: 1 },
  block: { count: 1 },
};

export const LOADING_KINDS = Object.keys(LOADING_PRESETS) as LoadingKind[];
