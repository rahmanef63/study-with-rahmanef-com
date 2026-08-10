// Unit cover for the pure halves of the editor seam: the block transforms the
// adapter delegates to, and the lesson → Page mapping that decides what an
// author sees when they open a materi that has never been edited.
import { describe, expect, it } from "vitest";
import { blocksToMarkdown } from "@notion/shared/lib/markdown";
import type { Block } from "@notion/shared/types";
import {
  addBlockAt, duplicateBlockAt, patchBlock, removeBlock,
  reorderBlocks, replaceBlock, setBlockType,
} from "./materi-blocks";
import { blocksForMateri, materiToPage } from "./materi-page";

const p = (id: string, text = ""): Block => ({ id, type: "paragraph", text });
const ids = (blocks: Block[]) => blocks.map((b) => b.id);

describe("block transforms", () => {
  it("inserts after the given index, and prepends at -1", () => {
    const base = [p("a"), p("b")];
    expect(ids(addBlockAt(base, 0, "new"))).toEqual(["a", "new", "b"]);
    expect(ids(addBlockAt(base, -1, "new"))).toEqual(["new", "a", "b"]);
    // Past the end clamps rather than leaving a hole.
    expect(ids(addBlockAt(base, 99, "new"))).toEqual(["a", "b", "new"]);
  });

  it("patches one block and leaves the others identical by reference", () => {
    const base = [p("a"), p("b")];
    const next = patchBlock(base, "a", { text: "halo" });
    expect(next[0]!.text).toBe("halo");
    expect(next[1]).toBe(base[1]);
  });

  it("never lets the page reach zero blocks", () => {
    expect(removeBlock([p("a")], "a")).toHaveLength(1);
    expect(removeBlock([p("a")], "a")[0]!.text).toBe("");
  });

  it("duplicates with fresh ids all the way down the tree", () => {
    const base: Block[] = [
      { id: "t", type: "toggle", text: "T", children: [p("c1", "anak")] },
      p("z"),
    ];
    const next = duplicateBlockAt(base, "t", "t2");
    expect(ids(next)).toEqual(["t", "t2", "z"]);
    const copy = next[1]!;
    expect(copy.children?.[0]?.text).toBe("anak");
    expect(copy.children?.[0]?.id).not.toBe("c1");
  });

  it("reorders to the given ids and never drops a block the caller forgot", () => {
    const base = [p("a"), p("b"), p("c")];
    expect(ids(reorderBlocks(base, ["c", "a", "b"]))).toEqual(["c", "a", "b"]);
    // Unknown ids ignored, duplicates ignored, missing ids appended.
    expect(ids(reorderBlocks(base, ["c", "c", "zzz"]))).toEqual(["c", "a", "b"]);
  });

  it("clears the outgoing type's own fields on turn-into", () => {
    const base: Block[] = [{ id: "a", type: "todo", text: "x", checked: true, lang: "ts" }];
    const next = setBlockType(base, "a", "paragraph")[0]!;
    expect(next.type).toBe("paragraph");
    expect(next.checked).toBeUndefined();
    expect(next.lang).toBeUndefined();
  });

  it("replaces a block wholesale", () => {
    const next = replaceBlock([p("a"), p("b")], "b", { id: "b", type: "h2", text: "Judul" });
    expect(next[1]!.type).toBe("h2");
  });
});

describe("blocksForMateri", () => {
  const md = "# Judul\n\nParagraf.\n";

  it("prefers contentBlocks when present — it is canonical", () => {
    const blocks = blocksForMateri({
      _id: "l1",
      title: "T",
      contentMd: md,
      contentBlocks: JSON.stringify([p("keep", "dari blok")]),
    });
    expect(blocks).toEqual([p("keep", "dari blok")]);
  });

  it("imports the existing markdown for a materi that predates the editor", () => {
    const blocks = blocksForMateri({ _id: "l1", title: "T", contentMd: md });
    expect(blocks.map((b) => b.type)).toEqual(["h1", "paragraph"]);
    // The import must round-trip: this is the invariant the server relies on
    // when it re-derives contentMd from whatever the author saves back.
    expect(blocksToMarkdown(blocks)).toBe(md);
  });

  it("falls back to the markdown rather than showing an empty page", () => {
    const blocks = blocksForMateri({
      _id: "l1", title: "T", contentMd: md, contentBlocks: "{ rusak",
    });
    expect(blocks.map((b) => b.type)).toEqual(["h1", "paragraph"]);
  });

  it("gives an empty materi one focusable block", () => {
    expect(blocksForMateri({ _id: "l1", title: "T", contentMd: "" })).toHaveLength(1);
  });
});

describe("materiToPage", () => {
  it("maps id + title and defaults every column-less Page field", () => {
    const page = materiToPage({ _id: "l1", title: "Sub Agents", contentMd: "" }, [p("a")]);
    expect(page.id).toBe("l1");
    expect(page.title).toBe("Sub Agents");
    expect(page.parentId).toBeNull();
    expect(page.favorite).toBe(false);
    expect(page.trashed).toBe(false);
  });
});
