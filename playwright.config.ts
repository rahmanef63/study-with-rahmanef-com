// Playwright e2e smoke config (STATUS row #13, agent zeta).
// Root-level per Playwright convention — granted for this assignment only
// (docs/AGENT-PROMPTS.md, zeta prompt). Everything else e2e lives in e2e/.
//
// Target selection is env-driven so ONE config serves local, staging, and prod:
//   E2E_BASE_URL unset            → http://localhost:3000 (run `npm run dev` first)
//   E2E_BASE_URL=https://staging… → staging
//   E2E_BASE_URL=https://study-with.rahmanef.com → prod (anon read-only ONLY — e2e/README.md)
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Artifacts stay under e2e/ so they're covered by e2e/.gitignore
  // (root .gitignore is a shared surface — proposal filed for alpha instead).
  outputDir: "./e2e/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/playwright-report", open: "never" }],
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  // chromium only — hemat (charity project, zero-cost law). Add firefox/webkit
  // only if a real cross-browser defect ever shows up.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Future authenticated run (see e2e/auth.setup.ts + e2e/README.md):
    // 1. Rahman records storage state ONCE, locally:
    //      npx playwright codegen --save-storage=e2e/.auth/user.json $E2E_BASE_URL
    // 2. Uncomment:
    // {
    //   name: "chromium-auth",
    //   use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
    //   testMatch: /.*\.auth\.spec\.ts/,
    // },
  ],
});
