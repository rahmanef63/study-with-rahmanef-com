// courses slice — tag input parsing for the authoring forms (pure; no React).
//
// SSOT for the RULES is convex/features/materi/validate.ts `normalizeTags`,
// which re-normalises and REJECTS anything outside them (P0: the server is the
// validator, this is not). The mirror exists so an author never meets a rule by
// being rejected: "Prompt Engineering!" becomes `prompt-engineering` while they
// type, instead of coming back as VALIDATION_FAILED after a save.
//
// Deliberately SANITISING where the server is STRICT: an illegal character is
// dropped here, whereas the server would fail the whole save. Dropping is safe
// because the result is always a legal tag or nothing, and the author sees the
// chip they actually get before submitting.
export const TAG_MIN_LENGTH = 2;
export const TAG_MAX_LENGTH = 32;

/** One raw chip → the tag the server would store, or "" if nothing survives. */
export function normalizeTag(raw: string): string {
  const tag = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  // Truncating can expose a trailing dash, which the server's kebab rule
  // rejects — strip again AFTER the cut, never before.
  return tag.slice(0, TAG_MAX_LENGTH).replace(/-+$/g, "");
}

/**
 * Split a free-text tag field on commas/newlines, normalise every piece, drop
 * what is too short to be navigation, dedupe, and cap. Order is preserved:
 * the first spelling of a tag wins, so re-typing one never reshuffles the list.
 */
export function parseTagInput(input: string, max: number): string[] {
  const out: string[] = [];
  for (const piece of input.split(/[,\n]/)) {
    const tag = normalizeTag(piece);
    if (tag.length < TAG_MIN_LENGTH) continue;
    if (out.includes(tag)) continue;
    if (out.length >= max) break;
    out.push(tag);
  }
  return out;
}
