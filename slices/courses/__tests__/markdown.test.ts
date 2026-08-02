// Safe-subset markdown parser — including the safety properties the lesson
// read surface depends on (HTML stays inert, only http(s) links linkify).
import { describe, expect, test } from "vitest";
import { parseInline, parseMarkdown } from "../lib/markdown";

describe("parseMarkdown blocks", () => {
  test("headings h1–h3, deeper hashes stay paragraphs", () => {
    const blocks = parseMarkdown("# Satu\n## Dua\n### Tiga\n#### Empat");
    expect(blocks.map((b) => b.kind)).toEqual([
      "heading",
      "heading",
      "heading",
      "paragraph",
    ]);
    expect(blocks[0]).toMatchObject({ level: 1 });
    expect(blocks[2]).toMatchObject({ level: 3 });
  });

  test("paragraph merging and blank-line separation", () => {
    const blocks = parseMarkdown("baris satu\nbaris dua\n\nparagraf baru");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      kind: "paragraph",
      inline: [{ kind: "text", text: "baris satu baris dua" }],
    });
  });

  test("unordered + ordered lists, kept separate by type", () => {
    const blocks = parseMarkdown("- a\n- b\n1. satu\n2. dua");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: "list", ordered: false });
    expect(blocks[1]).toMatchObject({ kind: "list", ordered: true });
    expect((blocks[0] as { items: unknown[] }).items).toHaveLength(2);
  });

  test("blockquote and fenced code (with language, CRLF tolerated)", () => {
    const blocks = parseMarkdown("> kutipan\r\n```ts\r\nconst x = 1;\r\n```");
    expect(blocks[0]).toMatchObject({ kind: "quote" });
    expect(blocks[1]).toMatchObject({ kind: "codeblock", lang: "ts", text: "const x = 1;" });
  });

  test("markdown syntax inside a fence is NOT parsed", () => {
    const blocks = parseMarkdown("```\n# bukan heading\n- bukan list\n```");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "codeblock", text: "# bukan heading\n- bukan list" });
  });

  test("unclosed fence keeps content as a code block (no data loss)", () => {
    const blocks = parseMarkdown("```js\nlet a = 1;");
    expect(blocks[0]).toMatchObject({ kind: "codeblock", lang: "js", text: "let a = 1;" });
  });

  test("raw HTML stays inert text (XSS-safe by construction)", () => {
    const blocks = parseMarkdown('<script>alert("xss")</script>');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "paragraph",
      inline: [{ kind: "text", text: '<script>alert("xss")</script>' }],
    });
  });
});

describe("parseInline marks", () => {
  test("bold, italic (both spellings), inline code", () => {
    expect(parseInline("**tebal** dan *miring* dan _miring_ dan `kode`")).toEqual([
      { kind: "bold", text: "tebal" },
      { kind: "text", text: " dan " },
      { kind: "italic", text: "miring" },
      { kind: "text", text: " dan " },
      { kind: "italic", text: "miring" },
      { kind: "text", text: " dan " },
      { kind: "code", text: "kode" },
    ]);
  });

  test("http(s) links linkify; javascript: URLs stay plain text", () => {
    expect(parseInline("[dok](https://example.com/a)")).toEqual([
      { kind: "link", text: "dok", url: "https://example.com/a" },
    ]);
    const hostile = parseInline("[x](javascript:alert(1))");
    expect(hostile.every((tok) => tok.kind !== "link")).toBe(true);
  });

  test("plain text passes through untouched", () => {
    expect(parseInline("teks biasa saja")).toEqual([{ kind: "text", text: "teks biasa saja" }]);
  });
});
