import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      // MUST precede the bare "@" entry: vite alias `find` is a prefix match,
      // so "@" would swallow "@notion/..." first.
      {
        find: "@notion",
        replacement: fileURLToPath(
          new URL("./slices/notion-app", import.meta.url),
        ),
      },
      {
        find: "@convex",
        replacement: fileURLToPath(new URL("./convex", import.meta.url)),
      },
      { find: "@", replacement: fileURLToPath(new URL(".", import.meta.url)) },
    ],
  },
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    include: [
      "convex/**/*.test.ts",
      "slices/**/*.test.{ts,tsx}",
      "shared/**/*.test.ts",
      // lib/ holds the pure engines the slices are thin shells over —
      // lib/peta/** is the whole /mulai assessment. Without this line its 56
      // specs (incl. the 274k-case reachability sweep) never run in CI.
      "lib/**/*.test.ts",
      // components/editor holds the block-editor adapter seam; its pure halves
      // (block transforms, lesson→Page mapping) are unit-tested there.
      "components/**/*.test.ts",
      // Route-tree guards live beside the routes they check.
      "app/**/*.test.ts",
    ],
    // Vendored appshell ships its own upstream tests; its window-geometry suites
    // assume a DOM viewport, but this repo runs vitest under edge-runtime (for
    // Convex), so workArea is 0 and cascade/layout assertions can't hold. The
    // shell is tested upstream — exclude it so the suite covers THIS app's code.
    exclude: [
      ...configDefaults.exclude,
      "slices/appshell/**",
      // Same story for the vendored notion-app cluster: its inline-decorator
      // suites build real DOM ranges (document.createElement, Selection,
      // Range), and this repo runs vitest under edge-runtime for Convex. They
      // are green upstream against happy-dom. Only these two files are
      // excluded — the other 8 notion-app suites (99 tests), including the
      // markdown⇄blocks bridge this app's save path depends on, run here.
      "slices/notion-app/**/inline-decorator/**",
      "slices/notion-app/**/inlineDecorator.test.ts",
    ],
  },
});
