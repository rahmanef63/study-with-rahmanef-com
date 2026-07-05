// YouTube helpers — client-side extraction sugar; the mutation re-validates
// server-side (P0), these tests pin the UX behavior + fixed embed origin.
import { describe, expect, test } from "vitest";
import {
  buildYoutubeEmbedUrl,
  buildYoutubeWatchUrl,
  extractYoutubeVideoId,
  isValidYoutubeVideoId,
} from "../lib/youtube";

const ID = "dQw4w9WgXcQ";

describe("extractYoutubeVideoId", () => {
  test.each([
    [ID, ID],
    [`https://www.youtube.com/watch?v=${ID}`, ID],
    [`https://www.youtube.com/watch?list=abc&v=${ID}&t=10`, ID],
    [`https://youtu.be/${ID}`, ID],
    [`https://youtu.be/${ID}?t=42`, ID],
    [`https://www.youtube.com/shorts/${ID}`, ID],
    [`https://www.youtube.com/embed/${ID}`, ID],
    [`https://www.youtube.com/live/${ID}`, ID],
    [`https://www.youtube-nocookie.com/embed/${ID}`, ID],
    [`  ${ID}  `, ID],
  ])("extracts from %s", (input, expected) => {
    expect(extractYoutubeVideoId(input)).toBe(expected);
  });

  test.each(["", "dQw4w9WgXc", "dQw4w9WgXcQQ", "https://vimeo.com/12345", "not a url at all!"])(
    "returns null for %s",
    (input) => {
      expect(extractYoutubeVideoId(input)).toBeNull();
    }
  );
});

describe("id validation + url builders", () => {
  test("isValidYoutubeVideoId accepts exactly 11 [A-Za-z0-9_-] chars", () => {
    expect(isValidYoutubeVideoId(ID)).toBe(true);
    expect(isValidYoutubeVideoId("abc_def-123")).toBe(true);
    expect(isValidYoutubeVideoId("abc def 123")).toBe(false);
    expect(isValidYoutubeVideoId(`https://youtu.be/${ID}`)).toBe(false);
  });

  test("embed URL is pinned to the youtube-nocookie origin", () => {
    expect(buildYoutubeEmbedUrl(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
    expect(buildYoutubeEmbedUrl("../evil.example")).toBeNull();
  });

  test("watch URL only builds from a valid id", () => {
    expect(buildYoutubeWatchUrl(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(buildYoutubeWatchUrl("nope")).toBeNull();
  });
});
