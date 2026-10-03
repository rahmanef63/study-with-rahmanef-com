// Disconnected presentation fixture. No production routes, data, auth or Convex transport.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "vite";
import tailwind from "@tailwindcss/postcss";
const repo = fileURLToPath(new URL("../", import.meta.url));
const fixture = path.join(repo, "e2e/admin-fixture");
const server = await createServer({
  configFile: false, root: fixture, esbuild: { jsx: "automatic" },
  define: { "process.env.NEXT_PUBLIC_DEFAULT_COMMUNITY_SLUG": JSON.stringify("belajar-ai") },
  plugins: [{ name: "fixture-only-media-map", enforce: "pre", resolveId(source, importer) {
    if (source === "../hooks/use-youtube-metadata" && importer?.startsWith(`${repo}slices/courses/components/`)) return path.join(fixture, "media-adapter.ts");
  } }],
  resolve: { dedupe: ["react", "react-dom"], alias: [
    { find: /^next\/(link|navigation)$/, replacement: path.join(fixture, "next-adapter.tsx") },
    { find: /^next\/dynamic$/, replacement: path.join(fixture, "dynamic-adapter.tsx") },
    { find: /^@\/features\/profiles$/, replacement: path.join(fixture, "profiles-adapter.tsx") },
    { find: /^@\/features\/convex-auth$/, replacement: path.join(fixture, "auth-adapter.ts") },
    { find: /^@\/features\/(.*)$/, replacement: `${repo}slices/$1` },
    { find: /^@convex\/(.*)$/, replacement: `${repo}convex/$1` },
    { find: /^@\/(.*)$/, replacement: `${repo}$1` },
  ] },
  css: { postcss: { plugins: [tailwind({ base: repo })] } },
  server: { host: "0.0.0.0", port: 3013, strictPort: true, allowedHosts: [".trycloudflare.com"], fs: { allow: [repo, path.join(repo, "node_modules")] } },
});
await server.listen();
console.log("Admin fixture listening on http://localhost:3013 (0.0.0.0). Synthetic presentation data; no production auth or Convex connection.");
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { await server.close(); process.exit(0); });
