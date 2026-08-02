// SKELETON — storageState pattern for a FUTURE authenticated e2e run.
// NOT wired into any project yet and not matched by the default testMatch
// (only *.spec.ts / *.test.ts run), so this file is inert until activated.
//
// Why a skeleton: sign-in is Google OAuth only (PRD R1 / DECISIONS #15).
// Automating real Google OAuth in CI is against Google ToS, flaky (bot
// detection, 2FA), and would require real credentials in CI — do NOT attempt.
//
// Activation recipe (one-time, Rahman, on his own machine):
//   1. Record a signed-in browser state once — log in manually in the window
//      that opens, then close it; cookies + localStorage land in the file:
//        npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk
//      (or with E2E_BASE_URL=https://study-with.rahmanef.com for prod state)
//   2. e2e/.auth/ is gitignored (e2e/.gitignore) — the state file holds live
//      session tokens. NEVER commit it, never paste its contents in chat.
//   3. Uncomment the "chromium-auth" project in playwright.config.ts; it points
//      storageState at e2e/.auth/user.json and matches *.auth.spec.ts files.
//   4. Write authenticated specs as e2e/<name>.auth.spec.ts (member paths:
//      join, progress, quiz attempt — against LOCAL/staging only, never prod).
//
// When Convex auth sessions expire, re-run step 1 — that's the whole refresh.
import { test as setup } from "@playwright/test";
import fs from "node:fs";

export const AUTH_STATE = "e2e/.auth/user.json";

// Guarded no-op: if a recorded state exists we simply validate it's readable;
// if not, we skip with a pointer to the recipe. This file never performs OAuth.
setup("authenticated storage state is available", async () => {
  setup.skip(
    !fs.existsSync(AUTH_STATE),
    `No recorded auth state at ${AUTH_STATE} — see the activation recipe at the top of this file.`,
  );
  // Future: sanity-check the state (e.g. open "/" with it and expect the
  // account chip) once the chromium-auth project is enabled.
});
