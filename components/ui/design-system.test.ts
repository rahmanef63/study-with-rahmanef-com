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

  it.each(uiFiles)("%s takes its radius from the token, not a named step", (file) => {
    // ONE radius language: `rounded-[var(--radius)]`. A named step resolves
    // through the derived ladder (--radius-sm/-md/-lg), which is a SECOND
    // scale that drifts from the token the rest of the app uses — and for the
    // whole arcade era resolved to 0 or to a negative calc that browsers drop
    // on the floor, so nobody noticed it was a second scale at all.
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

describe("cascade layers", () => {
  // Comments are stripped first: a brace inside one would derail the scan.
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "")

  /** The selectors of every block still open at `index`, outermost first. */
  function enclosingBlocks(index: number): string[] {
    const stack: string[] = []
    let lineStart = 0
    for (let k = 0; k < index; k += 1) {
      const ch = css[k]
      if (ch === "\n") lineStart = k + 1
      else if (ch === "{") stack.push(css.slice(lineStart, k).trim())
      else if (ch === "}") stack.pop()
    }
    return stack
  }

  it("keeps the default border colour inside @layer base", () => {
    // THE RULE THIS PINS: unlayered CSS beats every cascade layer no matter
    // the specificity, and Tailwind emits `border-primary` into @layer
    // utilities. So a `* { border-color }` written outside a layer overrides
    // every border-colour utility in the app — silently, with no build error
    // and nothing to see in the component. Measured on production at 3e64bda:
    // 65 elements across the seven anonymous routes carried one, and all 65
    // painted the same grey. Gold buttons had grey outlines, focus rings never
    // changed colour, aria-invalid fields stayed neutral.
    const i = css.search(/\*\s*\{[^}]*border-color/)
    expect(i).toBeGreaterThan(-1)
    expect(enclosingBlocks(i)).toEqual(["@layer base"])
  })
})
