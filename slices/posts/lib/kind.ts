// posts slice — the kind vocabulary. Lookup maps, not if-chains
// (rr-conventions "Dynamic over hardcoded"): adding a kind is one row here plus
// one literal in the server union.
import type { PostsCopy } from "../config/copy";
import type { PostKind } from "../types";

/** Chip order in the feed filter — mirrors the server union, "Semua" is the UI's own. */
export const POST_KINDS: readonly PostKind[] = [
  "diskusi",
  "pengumuman",
  "usulan",
  "sumber",
] as const;

const LABEL_KEY: Record<PostKind, keyof PostsCopy> = {
  diskusi: "kindDiskusi",
  pengumuman: "kindPengumuman",
  usulan: "kindUsulan",
  sumber: "kindSumber",
};

/**
 * Badge tone per kind — token classes only, drawn from the --chart-* sprite
 * ramp (the SSOT for "anything ranked or categorised"). Never a hex, never a
 * local green-means-success.
 */
const TONE: Record<PostKind, string> = {
  diskusi: "border-chart-2/50 bg-chart-2/10 text-chart-2",
  pengumuman: "border-chart-3/50 bg-chart-3/10 text-chart-3",
  usulan: "border-chart-5/50 bg-chart-5/10 text-chart-5",
  sumber: "border-chart-4/50 bg-chart-4/10 text-chart-4",
};

export function postKindLabel(kind: PostKind, copy: PostsCopy): string {
  return copy[LABEL_KEY[kind]];
}

export function postKindTone(kind: PostKind): string {
  return TONE[kind];
}

/** Narrow an unknown string (route/query param) to a kind, or null. */
export function parsePostKind(value: string | null | undefined): PostKind | null {
  return value !== null && value !== undefined && (POST_KINDS as readonly string[]).includes(value)
    ? (value as PostKind)
    : null;
}
