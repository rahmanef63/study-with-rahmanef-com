// Local presentation fixture only. No production route, auth state or Convex connection.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "vite";
import tailwind from "@tailwindcss/postcss";

const repo = fileURLToPath(new URL("../", import.meta.url));
const fixture = path.join(repo, "e2e/reader-fixture");
const server = await createServer({
  configFile: false,
  root: fixture,
  esbuild: { jsx: "automatic" },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^convex\/react$/, replacement: path.join(fixture, "convex-adapter.tsx") },
      { find: /^next\/(link|navigation)$/, replacement: path.join(fixture, "next-adapter.tsx") },
      { find: /^next\/dynamic$/, replacement: path.join(fixture, "dynamic-adapter.tsx") },
      { find: /^@\/features\/(courses|progress|markdown)$/, replacement: path.join(fixture, "feature-adapter.ts") },
      { find: /^@\/features\/(.*)$/, replacement: `${repo}slices/$1` },
      { find: /^@convex\/(.*)$/, replacement: `${repo}convex/$1` },
      { find: /^@\/(.*)$/, replacement: `${repo}$1` },
    ],
  },
  css: { postcss: { plugins: [tailwind({ base: repo })] } },
  server: { host: "0.0.0.0", port: 3012, strictPort: true, allowedHosts: [".trycloudflare.com"], fs: { allow: [repo, path.join(repo, "node_modules")] } },
});
await server.listen();
console.log("Reader fixture listening on http://localhost:3012 (0.0.0.0). Disconnected local data; presentation checks only.");
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await server.close(); process.exit(0); });
