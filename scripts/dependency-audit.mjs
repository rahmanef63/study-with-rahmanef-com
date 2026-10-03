// Narrow, expiring exception for an unpatched development-only advisory.
// Never tolerate a production dependency, a different advisory, or registry failure.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const known = new Set(["braces", "micromatch", "fast-glob", "@next/eslint-plugin-next", "eslint-config-next"]);
const advisory = "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm";
export function knownDevelopmentOnly(report, lock, now = Date.now()) {
  const rows = Object.entries(report.vulnerabilities ?? {});
  if (!rows.length) return !report.error;
  if (report.error || now >= Date.parse("2026-11-01T00:00:00Z")) return false;
  return rows.every(([name, row]) => known.has(name) && row.severity === "high" &&
    row.nodes?.length > 0 && row.nodes.every(path => lock.packages?.[path]?.dev === true) &&
    row.via?.length > 0 && row.via.every(via => typeof via === "string" ? known.has(via) : via.url === advisory));
}
function audit(args) {
  const run = spawnSync("npm", ["audit", ...args, "--json"], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (run.error || run.signal || ![0, 1].includes(run.status)) throw new Error("npm audit did not complete");
  const report = JSON.parse(run.stdout);
  if (report.error || !report.metadata?.vulnerabilities) throw new Error("npm audit registry response unavailable");
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const prod = audit(["--omit=dev"]);
    if (prod.metadata.vulnerabilities.total !== 0) throw new Error("Production dependency advisory detected");
    const report = audit([]);
    const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
    console.log(JSON.stringify({ production: prod.metadata.vulnerabilities, full: report.metadata.vulnerabilities, advisories: Object.keys(report.vulnerabilities ?? {}) }));
    if (!knownDevelopmentOnly(report, lock)) throw new Error("New, production, or expired development advisory detected");
    if (report.metadata.vulnerabilities.total) console.log(`Temporary development-only exception: ${advisory}; expires 2026-11-01; no patched version as of 2026-10-03.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
