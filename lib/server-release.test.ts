// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("node:fs", () => ({ readFileSync: vi.fn() }));

afterEach(() => { vi.resetModules(); vi.unstubAllEnvs(); });

test("release identity changes even when Next uses the same BUILD_ID", async () => {
  const { readFileSync } = await import("node:fs");
  for (const deploymentId of ["release-a", "release-b"]) {
    vi.resetModules();
    vi.mocked(readFileSync).mockImplementation((path) => String(path).endsWith("BUILD_ID")
      ? "shared-next-build" : JSON.stringify({ config: { deploymentId } }));
    const { serverRelease } = await import("./server-release");
    expect(serverRelease().id).toBe(deploymentId);
  }
});

test("a revision environment variable cannot mark an unbuilt server ready", async () => {
  vi.stubEnv("APP_REVISION", "source-commit");
  const { readFileSync } = await import("node:fs");
  vi.mocked(readFileSync).mockImplementation(() => { throw new Error("missing build"); });
  const { serverRelease } = await import("./server-release");
  expect(serverRelease()).toEqual({ id: "unknown", revision: "source-commit" });
});

test("production startup reuses the built deployment ID despite runtime environment drift", async () => {
  vi.stubEnv("APP_REVISION", "different-runtime-env");
  const { readFileSync } = await import("node:fs");
  vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ config: { deploymentId: "built-release" } }));
  const { default: config } = await import("../next.config.mjs");
  const { PHASE_PRODUCTION_SERVER, PHASE_PRODUCTION_BUILD } = await import("next/constants.js");
  expect(config(PHASE_PRODUCTION_SERVER).deploymentId).toBe("built-release");
  expect(config(PHASE_PRODUCTION_BUILD).deploymentId).toBe("different-runtime-env");
});
