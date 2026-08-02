// Playwright e2e smoke config (STATUS row #13, agent zeta).
// Root-level per Playwright convention — granted for this assignment only
// (docs/AGENT-PROMPTS.md, zeta prompt). Everything else e2e lives in e2e/.
//
// Target selection is env-driven so ONE config serves local, staging, and prod:
//   E2E_BASE_URL unset            → http://localhost:3000 (run `npm run dev` first)
//   E2E_BASE_URL=https://staging… → staging
//   E2E_BASE_URL=https://study-with.rahmanef.com → prod (anon read-only ONLY — e2e/README.md)
import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// State login hasil rekam manual (gitignored). Project auth hanya didaftarkan
// bila file-nya ADA — tanpa state, `playwright test` tetap jalan anon-only
// tanpa error load config (CI tidak pernah punya state ini).
const AUTH_STATE = "e2e/.auth/user.json";
const HAS_AUTH_STATE = fs.existsSync(AUTH_STATE);

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
      testIgnore: /.*\.auth\.spec\.ts/,
    },
    // Authenticated run (v1.8 #40 — AKTIF bila state ada). Rekam SEKALI
    // (login manual di jendela yang terbuka, lalu tutup):
    //   npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk
    // Tanpa file itu, project ini tidak terdaftar (anon-only, CI aman).
    // Specs juga MENOLAK prod kecuali E2E_ALLOW_PROD_AUTH=1 (member.auth.spec.ts).
    ...(HAS_AUTH_STATE
      ? [
          {
            name: "chromium-auth",
            use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
            testMatch: /.*\.auth\.spec\.ts/,
          },
        ]
      : []),
  ],
});
