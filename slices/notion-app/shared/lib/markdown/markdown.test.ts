import { describe, it, expect } from "vitest";
import { blocksToMarkdown } from "./toMarkdown";
import { markdownToBlocks } from "./fromMarkdown";
import type { Block } from "../../types/blocks";

const b = (p: Partial<Block> & { type: Block["type"] }): Block => ({
  id: "x", text: "", ...p,
});

describe("blocksToMarkdown", () => {
  it("maps headings, lists, todo, quote", () => {
    const md = blocksToMarkdown([
      b({ type: "h1", text: "Title" }),
      b({ type: "paragraph", text: "Hello **world**" }),
      b({ type: "bullet", text: "one" }),
      b({ type: "numbered", text: "first" }),
      b({ type: "todo", text: "buy milk", checked: true }),
      b({ type: "quote", text: "wisdom" }),
    ]);
    expect(md).toContain("# Title");
    expect(md).toContain("Hello **world**");
    expect(md).toContain("- one");
    expect(md).toContain("1. first");
    expect(md).toContain("- [x] buy milk");
    expect(md).toContain("> wisdom");
  });

  it("fences code with lang, renders divider + equation", () => {
    const md = blocksToMarkdown([
      b({ type: "code", text: "const x = 1", lang: "ts" }),
      b({ type: "divider" }),
      b({ type: "equation", text: "E = mc^2" }),
    ]);
    expect(md).toContain("```ts\nconst x = 1\n```");
    expect(md).toContain("---");
    expect(md).toContain("$$\nE = mc^2\n$$");
  });

  it("emits GitHub alert for callout and image markdown", () => {
    const md = blocksToMarkdown([
      b({ type: "callout", text: "heads up", calloutKind: "warning" }),
      b({ type: "image", url: "/a.png", caption: "diagram" }),
    ]);
    expect(md).toContain("> [!WARNING]");
    expect(md).toContain("> heads up");
    expect(md).toContain("![diagram](/a.png)");
  });

  it("builds a markdown table with alignment", () => {
    const md = blocksToMarkdown([
      b({ type: "table", tableRows: [["A", "B"], ["1", "2"]], tableAlign: ["left", "right"] }),
    ]);
    expect(md).toContain("| A | B |");
    expect(md).toContain("| :--- | ---: |");
    expect(md).toContain("| 1 | 2 |");
  });

  it("flattens columns to preserve content", () => {
    const md = blocksToMarkdown([
      b({ type: "columns2", columns: [[b({ type: "paragraph", text: "left" })], [b({ type: "paragraph", text: "right" })]] }),
    ]);
    expect(md).toContain("left");
    expect(md).toContain("right");
  });
});

describe("markdownToBlocks", () => {
  it("parses every basic construct", () => {
    const blocks = markdownToBlocks([
      "# Title",
      "",
      "Hello **world**",
      "",
      "- one",
      "- two",
      "",
      "1. first",
      "",
      "- [x] done",
      "- [ ] todo",
      "",
      "> quote",
      "",
      "---",
    ].join("\n"));
    const types = blocks.map((x) => x.type);
    expect(types).toContain("h1");
    expect(types).toContain("paragraph");
    expect(types.filter((t) => t === "bullet")).toHaveLength(2);
    expect(types).toContain("numbered");
    expect(blocks.find((x) => x.type === "todo" && x.checked)?.text).toBe("done");
    expect(types).toContain("quote");
    expect(types).toContain("divider");
  });

  it("parses fenced code with language", () => {
    const blocks = markdownToBlocks("```ts\nconst x = 1\n```");
    expect(blocks[0]).toMatchObject({ type: "code", lang: "ts", text: "const x = 1" });
  });

  it("parses callout, table, image, equation, toggle", () => {
    const blocks = markdownToBlocks([
      "> [!TIP]",
      "> use it",
      "",
      "| A | B |",
      "| :--- | ---: |",
      "| 1 | 2 |",
      "",
      "![cap](/a.png)",
      "",
      "$$",
      "x^2",
      "$$",
      "",
      "<details><summary>more</summary>",
      "",
      "hidden",
      "",
      "</details>",
    ].join("\n"));
    expect(blocks.find((x) => x.type === "callout")).toMatchObject({ calloutKind: "tip", text: "use it" });
    const table = blocks.find((x) => x.type === "table");
    expect(table?.tableRows).toEqual([["A", "B"], ["1", "2"]]);
    expect(table?.tableAlign).toEqual(["left", "right"]);
    expect(blocks.find((x) => x.type === "image")).toMatchObject({ url: "/a.png", caption: "cap" });
    expect(blocks.find((x) => x.type === "equation")?.text).toBe("x^2");
    const toggle = blocks.find((x) => x.type === "toggle");
    expect(toggle?.text).toBe("more");
    expect(toggle?.children?.[0]).toMatchObject({ type: "paragraph", text: "hidden" });
  });
});

describe("round-trip notion → md → notion", () => {
  it("preserves structure + inline markers", () => {
    const original: Block[] = [
      b({ type: "h2", text: "Spec" }),
      b({ type: "paragraph", text: "with **bold**, _em_, `code`, [link](/x)" }),
      b({ type: "bullet", text: "alpha" }),
      b({ type: "todo", text: "ship", checked: false }),
      b({ type: "code", text: "y = 2", lang: "py" }),
    ];
    const round = markdownToBlocks(blocksToMarkdown(original));
    expect(round.map((x) => x.type)).toEqual(["h2", "paragraph", "bullet", "todo", "code"]);
    expect(round[1]!.text).toBe("with **bold**, _em_, `code`, [link](/x)");
    expect(round[3]).toMatchObject({ type: "todo", checked: false, text: "ship" });
    expect(round[4]).toMatchObject({ type: "code", lang: "py", text: "y = 2" });
  });
});
