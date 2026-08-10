import { describe, it, expect } from "vitest";
import { parseMarkdown } from "./parse";

describe("parseMarkdown", () => {
  it("parses headings, paragraph, lists, todo, quote, divider", () => {
    const nodes = parseMarkdown([
      "# Title",
      "",
      "Body **text**",
      "",
      "- a",
      "- b",
      "",
      "1. one",
      "",
      "- [x] done",
      "- [ ] open",
      "",
      "> quote",
      "",
      "---",
    ].join("\n"));
    const types = nodes.map((n) => n.type);
    expect(types).toEqual([
      "heading", "paragraph", "bullet", "bullet", "numbered", "todo", "todo", "quote", "divider",
    ]);
    expect(nodes[0]).toMatchObject({ type: "heading", level: 1, text: "Title" });
    expect(nodes[5]).toMatchObject({ type: "todo", checked: true, text: "done" });
    expect(nodes[6]).toMatchObject({ type: "todo", checked: false });
  });

  it("parses code, equation, callout, table, image, toggle", () => {
    const nodes = parseMarkdown([
      "```ts",
      "const x = 1",
      "```",
      "",
      "$$",
      "x^2",
      "$$",
      "",
      "> [!WARNING]",
      "> be careful",
      "",
      "| A | B |",
      "| :--- | ---: |",
      "| 1 | 2 |",
      "",
      "![cap](/img.png)",
      "",
      "<details><summary>more</summary>",
      "",
      "hidden text",
      "",
      "</details>",
    ].join("\n"));
    expect(nodes.find((n) => n.type === "code")).toMatchObject({ lang: "ts", text: "const x = 1" });
    expect(nodes.find((n) => n.type === "equation")).toMatchObject({ text: "x^2" });
    expect(nodes.find((n) => n.type === "callout")).toMatchObject({ kind: "warning", text: "be careful" });
    const table = nodes.find((n) => n.type === "table");
    expect(table).toMatchObject({ rows: [["A", "B"], ["1", "2"]], align: ["left", "right"] });
    expect(nodes.find((n) => n.type === "image")).toMatchObject({ url: "/img.png", caption: "cap" });
    const toggle = nodes.find((n) => n.type === "toggle");
    expect(toggle).toMatchObject({ text: "more" });
    expect(toggle?.type === "toggle" && toggle.children[0]).toMatchObject({ type: "paragraph", text: "hidden text" });
  });

  it("keeps inline markers verbatim in text", () => {
    const nodes = parseMarkdown("with **bold**, _em_, `code`, [l](/x)");
    expect(nodes[0]).toMatchObject({ type: "paragraph", text: "with **bold**, _em_, `code`, [l](/x)" });
  });

  it("routes mermaid + chart fences to dedicated nodes", () => {
    const nodes = parseMarkdown([
      "```mermaid",
      "flowchart LR",
      "  A --> B",
      "```",
      "",
      "```chart",
      '{ "type": "bar", "data": [{ "name": "A", "value": 3 }] }',
      "```",
      "",
      "```ts",
      "const keep = true",
      "```",
    ].join("\n"));
    expect(nodes[0]).toMatchObject({ type: "diagram", text: "flowchart LR\n  A --> B" });
    expect(nodes[1]?.type).toBe("chart");
    expect(nodes[2]).toMatchObject({ type: "code", lang: "ts" });
  });
});
