# Changelog — appshell

## 1.5.1 — 2026-06-10

- Host wiring: `AppShell` self-registers `appshellTools` (module-store ctx) via `useAgentTools` — the whole desktop becomes agent-drivable on mount.

## 1.5.0 — 2026-06-10

- Agentic tool collection (`lib/tools.ts`): `appshellTools` exports 12
  function-calling tools for the shared agent kit (`@/shared/agentic`).
  The slice is NOT an agent — register the collection with a host agent
  (e.g. assistant's `registerAssistantTools(appshellTools, () => ctx)`);
  one agent drives many slices. Contract now declares `provides.tools`.
