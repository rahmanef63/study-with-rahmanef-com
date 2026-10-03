Run `node scripts/reader-preview.mjs` from the repository. Open `http://localhost:3012`.

Opt-in reusable acceptance: `READER_FIXTURE_URL=http://127.0.0.1:3012 npx playwright test e2e/reader-layout.fixture.spec.ts --project=chromium`. The spec skips without the variable and rejects non-loopback hosts. It overrides auth storage and blocks Convex domains.

This local-only harness mounts the production shell, reader layout, syllabus, markdown reader, comments, quiz and mobile dock. Next navigation uses local history, and a fake Convex hook transport supplies deterministic local fixtures. Actual slice mutation hooks still run, including locks and error handling. No auth session or backend is contacted; this does not prove server access control or authenticated integration.

Parameters: `lesson=lesson-1` through `lesson-40`, `mode=quiz`, `progress=loading|truncated`, `comments=loading|empty`, `quiz=loading`, `failAdd=1`, `failDelete=1`, `delay=1000`. Omitted parameters select loaded successful states. The fixture's local navigation preserves these parameters. Inspect `window.__readerFixture.calls` for mutation call counts.

Check at 1440×900 and 375×812: syllabus and reading panel scroll separately on desktop; mobile disclosure and document scroll remain usable; completion/quiz actions clear the dock; long comments stay contained. Type a root/reply draft, navigate to another lesson, and confirm draft/reply/delete state resets. Failed add retains text; failed delete retains its dialog; repeated submit while pending calls the fake transport once. No fixture route is added to the production Next application.

The fixture copies the production body's four safe-area variables and `viewport-fit=cover`; omitting these makes `calc(...var(--safe-b)...)` invalid and produces a false dock-overlap failure. Check both default 0px and simulated 20px bottom inset. Reading layout is keyed by lesson just as in the production composition.
