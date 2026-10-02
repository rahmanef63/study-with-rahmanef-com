import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let id: string | undefined;

export function serverRelease() {
  if (id === undefined) {
    try {
      const buildId = readFileSync(join(process.cwd(), ".next/BUILD_ID"), "utf8").trim();
      const config = JSON.parse(readFileSync(join(process.cwd(), ".next/required-server-files.json"), "utf8"));
      // Next 16 can share BUILD_ID across releases when deploymentId is set.
      id = buildId ? config.config?.deploymentId || buildId : "unknown";
    } catch {
      id = "unknown";
    }
  }
  return { id, revision: process.env.APP_REVISION || null };
}
