// courses slice — the tag input mirror. These assertions ARE the contract
// with convex/features/materi/validate.ts `normalizeTags`: everything this
// function emits must be something the server accepts unchanged, because a
// chip the author can see is a promise that the save will not be rejected.
import { describe, expect, test } from "vitest";
import { normalizeTag, parseTagInput, TAG_MAX_LENGTH } from "../lib/tags";
import { MAX_TAGS_PER_LESSON } from "../config/limits";

/** The server's kebab rule (KEBAB_RE) — nothing may escape this. */
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("normalizeTag", () => {
  test("lowercases, collapses whitespace to one dash, trims dashes", () => {
    expect(normalizeTag("  Prompt   Engineering ")).toBe("prompt-engineering");
    expect(normalizeTag("--AI--")).toBe("ai");
  });

  test("drops characters the server would reject instead of failing the save", () => {
    expect(normalizeTag("Prompt Engineering!")).toBe("prompt-engineering");
    expect(normalizeTag("ai/ml")).toBe("aiml");
    expect(normalizeTag("emoji ✨ tag")).toBe("emoji-tag");
  });

  test("nothing salvageable → empty string, never a half-tag", () => {
    expect(normalizeTag("   ")).toBe("");
    expect(normalizeTag("!!!")).toBe("");
  });

  test("truncation cannot leave the trailing dash the server rejects", () => {
    const tag = normalizeTag(`${"a".repeat(TAG_MAX_LENGTH - 1)} tail`);
    expect(tag.length).toBeLessThanOrEqual(TAG_MAX_LENGTH);
    expect(tag).toMatch(KEBAB);
  });
});

describe("parseTagInput", () => {
  test("splits on commas and newlines, dedupes, keeps first-seen order", () => {
    expect(parseTagInput("ai, Prompt\nai , writing", MAX_TAGS_PER_LESSON)).toEqual([
      "ai",
      "prompt",
      "writing",
    ]);
  });

  test("drops pieces too short to be navigation", () => {
    expect(parseTagInput("a, ai, b", MAX_TAGS_PER_LESSON)).toEqual(["ai"]);
  });

  test("caps at the server's per-materi limit", () => {
    const many = Array.from({ length: MAX_TAGS_PER_LESSON + 5 }, (_, i) => `tag${i}`).join(",");
    expect(parseTagInput(many, MAX_TAGS_PER_LESSON)).toHaveLength(MAX_TAGS_PER_LESSON);
  });

  test("every emitted tag is legal server-side", () => {
    for (const tag of parseTagInput("Prompt Engineering!, ai/ml, ✨, RAG", MAX_TAGS_PER_LESSON)) {
      expect(tag).toMatch(KEBAB);
      expect(tag.length).toBeGreaterThanOrEqual(2);
      expect(tag.length).toBeLessThanOrEqual(TAG_MAX_LENGTH);
    }
  });
});
