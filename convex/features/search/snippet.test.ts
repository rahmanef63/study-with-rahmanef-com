// Pure unit specs for the snippet builder (no convex-test needed).
import { describe, expect, test } from "vitest";
import { makeSnippet, stripMarkdown } from "./snippet";
import { SNIPPET_MAX } from "./validate";

describe("stripMarkdown", () => {
  test("strips headings, emphasis, links, images, code and lists", () => {
    const md = [
      "# Judul Besar",
      "",
      "**tebal** _miring_ ~~coret~~ `kode`",
      "![gambar](https://img.example/x.png)",
      "[tautan bagus](https://example.com/path)",
      "- butir satu",
      "1. butir dua",
      "> kutipan",
      "```ts",
      "const rahasia = 1;",
      "```",
      "<b>html</b>",
    ].join("\n");
    const plain = stripMarkdown(md);
    expect(plain).toContain("Judul Besar");
    expect(plain).toContain("tebal miring coret kode");
    expect(plain).toContain("tautan bagus");
    expect(plain).toContain("butir satu");
    expect(plain).toContain("kutipan");
    expect(plain).not.toMatch(/[#*_~`>]|\]\(|https:\/\/|<b>|rahasia/);
  });

  test("collapses whitespace", () => {
    expect(stripMarkdown("a\n\n\n  b\t c")).toBe("a b c");
  });
});

describe("makeSnippet", () => {
  test("short content passes through untruncated", () => {
    expect(makeSnippet("Materi **pendek**.")).toBe("Materi pendek.");
  });

  test("long content truncates to SNIPPET_MAX + ellipsis", () => {
    const snippet = makeSnippet(`${"kata ".repeat(60)}`);
    expect(snippet.length).toBeLessThanOrEqual(SNIPPET_MAX + 1);
    expect(snippet.endsWith("…")).toBe(true);
  });
});
