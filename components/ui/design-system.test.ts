// @vitest-environment node
//
// Node, not the repo-wide edge-runtime: this suite reads files. It cannot use
// Vite's `?raw` for the stylesheet either — the Tailwind/PostCSS plugin claims
// `.css` first and hands back an empty string (measured), so `?raw` silently
// asserts nothing at all.
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/**
 * Guards for the two design-system rules a component cannot enforce on itself
 * and that a reviewer reliably misses inside a 40-line diff.
 */

const uiDir = dirname(fileURLToPath(import.meta.url))
const globalsCss = readFileSync(join(uiDir, "..", "..", "app", "globals.css"), "utf8")
const uiFiles = readdirSync(uiDir).filter((f) => f.endsWith(".tsx"))

// Everything inside the FIRST `@theme { … }` block, which is where the ramp
// lives. `@theme inline` further down only re-exports colours.
const themeStart = globalsCss.indexOf("@theme {")
const themeBlock = globalsCss.slice(themeStart, globalsCss.indexOf("\n}\n", themeStart))

describe("type scale", () => {
  const steps = [...themeBlock.matchAll(/^ {2}--text-([a-z0-9-]+):/gm)]
    .map((m) => m[1])
    // `--text-xs--line-height` matches the same pattern; a SIZE declaration is
    // the one with no second `--` inside its name.
    .filter((name) => !name.includes("--"))

  it("declares the semantic steps the components depend on", () => {
    expect(steps).toEqual(
      expect.arrayContaining(["caption", "footnote", "body", "title", "headline"]),
    )
  })

  it.each(steps)("--text-%s pairs its size with a leading AND a tracking", (step) => {
    // THE RULE: a size utility here is a finished typographic decision. A step
    // with no line-height inherits whatever the last author felt like, which is
    // precisely the "tipografi terlalu web" symptom the scale exists to remove.
    // Adding a step means adding all three lines.
    expect(themeBlock, `--text-${step}--line-height is missing`).toContain(
      `--text-${step}--line-height:`,
    )
    expect(themeBlock, `--text-${step}--letter-spacing is missing`).toContain(
      `--text-${step}--letter-spacing:`,
    )
  })

  it("keeps the two leadings as tokens rather than magic numbers", () => {
    expect(themeBlock).toContain("--leading-ui:")
    expect(themeBlock).toContain("--leading-prose:")
  })
})

describe("arcade primitives", () => {
  it("sees the whole ui directory", () => {
    expect(uiFiles.length).toBeGreaterThan(10)
  })

  it.each(uiFiles)("%s writes no dead rounded-* utility", (file) => {
    // --radius is 0, so `rounded-md` resolves to a NEGATIVE calc and every
    // other named step to 0. Writing one is dead code that tells the next
    // author a radius is on the table.
    // NOT policed: `rounded-full` (a circle is a shape, not a corner radius —
    // avatars and scrollbar thumbs are allowed to be round) and arbitrary
    // values like `rounded-[2px]`, which are a deliberate literal rather than
    // an accident. Comment lines are skipped so a rule can explain itself.
    const code = readFileSync(join(uiDir, file), "utf8")
      .split("\n")
      .filter((line) => {
        const t = line.trimStart()
        return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*")
      })
      .join("\n")
    expect(code).not.toMatch(/(?<![\w-])rounded(?:-[trbl]{1,2})?-(?:none|xs|sm|md|lg|xl|2xl|3xl)(?![\w-])/)
  })
})
