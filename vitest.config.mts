import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
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
    include: ["convex/**/*.test.ts", "slices/**/*.test.{ts,tsx}", "shared/**/*.test.ts"],
    // Vendored appshell ships its own upstream tests; its window-geometry suites
    // assume a DOM viewport, but this repo runs vitest under edge-runtime (for
    // Convex), so workArea is 0 and cascade/layout assertions can't hold. The
    // shell is tested upstream — exclude it so the suite covers THIS app's code.
    exclude: [...configDefaults.exclude, "slices/appshell/**"],
  },
});
