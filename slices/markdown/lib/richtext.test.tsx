import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parseMarkdown } from "./parse";
import { renderInline, tokenizeInline } from "./inline";
import { collectYoutubeSources, parseYoutubeSource, safeMarkdownUrl } from "./media";
import { renderNodes, MdNodeView } from "../components/MdNodeView";
import { MarkdownMediaProvider } from "../components/MarkdownMediaProvider";
import type * as Barrel from "../index";
import { expectTypeOf } from "vitest";

const render = (source: string) => renderToStaticMarkup(<>{renderNodes(parseMarkdown(source))}</>);
describe("rich-text grammar regressions", () => {
  test("keeps soft-wrapped paragraphs together and separates actual blocks", () => {
    expect(parseMarkdown("first line\nsecond line\n\n# Heading\n- item\nfollowing text")).toEqual([
      { type: "paragraph", text: "first line\nsecond line" }, { type: "heading", level: 1, text: "Heading" }, { type: "bullet", text: "item", indent: 0 }, { type: "paragraph", text: "following text" },
    ]);
  });
  test("preserves nested fences, language names, tildes and unterminated code", () => {
    expect(parseMarkdown("````bash-session\n```json\n{\"ok\":true}\n```\n````\n\n~~~c++\nint x;\n~~~")).toEqual([
      { type: "code", lang: "bash-session", text: '```json\n{"ok":true}\n```' }, { type: "code", lang: "c++", text: "int x;" },
    ]);
    expect(parseMarkdown("```plain-text\nlast line")).toEqual([{ type: "code", lang: "plain-text", text: "last line" }]);
  });
  test("preserves nested formatting, escaped prompt placeholders and variable code spans", () => {
    const html = renderToStaticMarkup(<>{renderInline("**bold with *italic*** and ~~**strike**~~. \\[BRAND NAME\\] \\*literal\\* ``use `ticks` here``")}</>);
    expect(html).toContain("<strong>bold with <em>italic</em></strong>");
    expect(html).toContain("<del><strong>strike</strong></del>");
    expect(html).toContain("[BRAND NAME] *literal*");
    expect(html).not.toContain("\\[BRAND");
    expect(html).toContain("use `ticks` here</code>");
    expect(tokenizeInline("snake_case_name")).toEqual([{ kind: "text", value: "snake_case_name" }]);
  });
  test("keeps balanced URL parentheses and strips only trailing bare-link punctuation", () => {
    const html = renderToStaticMarkup(<>{renderInline("[**reference**](https://example.com/a_(b)) and https://example.com/a_(b).")}</>);
    expect(html).toContain('href="https://example.com/a_(b)"');
    expect(html).toContain("<strong>reference</strong>");
    expect(html).not.toContain('href="https://example.com/a_(b)."');
  });
  test("renders nested semantic lists and preserves initial ordered number", () => {
    const html = render("3. first\n  - nested\n    1. deeper\n4. second");
    expect(html).toContain('<ol start="3"');
    expect(html).toMatch(/first<ul[^>]*>.*nested<ol/s);
    expect(html).toMatch(/deeper<\/li><\/ol><\/li><\/ul><\/li>/s);
  });
  test("handles escaped and code-span pipes, optional table edges and alignment", () => {
    expect(parseMarkdown("A | B\n:--- | ---:\n`x|y` | a\\|b")).toEqual([{ type: "table", rows: [["A", "B"], ["`x|y`", "a|b"]], align: ["left", "right"] }]);
    expect(parseMarkdown("| A |\n| --- |\n| B |")[0]).toMatchObject({ type: "table", rows: [["A"], ["B"]] });
  });
  test("supports nested details and reference directives without enabling raw HTML", () => {
    const nodes = parseMarkdown(":::details Outer\n:::details Inner\ninside\n:::\n:::\n\nafter");
    expect(nodes[0]).toMatchObject({ type: "toggle", text: "Outer", children: [{ type: "toggle", text: "Inner", children: [{ type: "paragraph", text: "inside" }] }] });
    expect(nodes[1]).toEqual({ type: "paragraph", text: "after" });
    const nested = parseMarkdown("<details><summary>Outer</summary>\n<details><summary>Inner</summary>\nx\n</details>\n</details>");
    expect(parseMarkdown("<details><summary>One line</summary>body</details>")[0]).toMatchObject({ type: "toggle", children: [{ type: "paragraph", text: "body" }] });
    expect(parseMarkdown("<details>\n<summary>Separate</summary>\nbody\n</details>")[0]).toMatchObject({ type: "toggle", text: "Separate" });
    expect(nested[0]).toMatchObject({ type: "toggle", children: [{ type: "toggle", text: "Inner" }] });
    expect(render("<script>alert(1)</script>")).not.toContain("<script>");
  });
});

describe("media trust and metadata contract", () => {
  const id = "dQw4w9WgXcQ";
  test("recognizes exact YouTube hosts and normalizes embedded/time-coded forms", () => {
    expect(parseYoutubeSource(`https://youtu.be/${id}?t=1m2s`)).toEqual({ videoId: id, startSeconds: 62 });
    for (const source of [`https://youtube.com/watch?v=${id}`, `https://www.youtube.com/shorts/${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) expect(parseYoutubeSource(source)).toEqual({ videoId: id });
    for (const source of [`https://evil-youtube.com/watch?v=${id}`, `https://youtube.com.evil.test/watch?v=${id}`, `https://youtube.com@evil.test/watch?v=${id}`, `https://www.youtube.com:8443/watch?v=${id}`]) expect(parseYoutubeSource(source)).toBeNull();
  });
  test("normalizes the safe explicit embed forms and collects unique IDs across toggles", () => {
    const nodes = parseMarkdown(`https://youtu.be/${id}\n\n:::embed https://www.youtube.com/watch?v=${id}\n\n[Video title](https://youtu.be/${id})\n\n<iframe src="https://www.youtube.com/embed/${id}" onload="alert(1)"></iframe>`);
    expect(nodes).toHaveLength(4);
    expect(nodes.every((node) => node.type === "youtube")).toBe(true);
    expect(collectYoutubeSources([{ type: "toggle", text: "Video", children: nodes }])).toEqual([{ videoId: id }]);
    const html = renderToStaticMarkup(<MarkdownMediaProvider youtubeMetadata={{ [id]: { videoId: id, title: "Actual title", channelName: "Actual channel", thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` } }}>{renderNodes(nodes)}</MarkdownMediaProvider>);
    expect(html).toContain(`https://www.youtube-nocookie.com/embed/${id}`);
    expect(html).toContain("Actual title");
    expect(html).toContain("Actual channel");
    expect(html).not.toContain("onload=");
    const fallback = renderToStaticMarkup(<MarkdownMediaProvider youtubeMetadata={{ [id]: { videoId: id, title: "Safe", thumbnailUrl: "/not-an-absolute-thumbnail" } }}>{renderNodes(nodes.slice(0, 1))}</MarkdownMediaProvider>);
    expect(fallback).not.toContain("<img");
  });
  test("rejects unsafe image/link schemes and protocol-relative URLs even in preparsed nodes", () => {
    for (const source of ["javascript:alert(1)", "data:image/svg+xml,x", "//evil.test/x", "file:///x", "/\\evil.test/x", "https://user:secret@example.com/x"]) expect(safeMarkdownUrl(source, true)).toBeNull();
    expect(safeMarkdownUrl("/image.png", true)).toBe("/image.png");
    const html = renderToStaticMarkup(<><MdNodeView node={{ type: "image", url: "javascript:alert(1)", caption: "Unsafe" }} />{renderInline("[Unsafe](javascript:alert(1)) [Other](//evil.test/x)")}</>);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("href=");
    expect(render('<iframe src="https://evil.test/video"></iframe>')).not.toContain("<iframe");
  });
  test("barrel exports the host metadata seam and safe parser helpers", () => {
    expectTypeOf<typeof Barrel.MarkdownMediaProvider>().toBeFunction();
    expectTypeOf<typeof Barrel.parseYoutubeSource>().toBeFunction();
    expectTypeOf<typeof Barrel.collectYoutubeSources>().toBeFunction();
    expectTypeOf<Barrel.YoutubeMetadata>().toMatchTypeOf<{ videoId: string; title: string }>();
  });
});
