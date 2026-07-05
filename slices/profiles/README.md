# profiles — Profil Pengguna (v1 minimal)

Slice for STATUS row **#4** (agent: delta). Own-profile only: the public page
`/u/[username]` and the badge wall are row #9 (v1.1).

## What it does

- **Ensure-on-first-login** (`ensureProfile`): idempotent; derives a globally
  unique lowercase-kebab-case username from the Google account (name → email
  local part), auto-suffixes `-2`, `-3`, … on collision so sign-in never fails.
- **Settings form** (`ProfileSettingsView` → mount at `/pengaturan/profil`):
  username, displayName, bio, avatarUrl. Explicit username rename to a taken
  name rejects `VALIDATION_FAILED`. Availability probe on blur.
- **Current-profile query** (`getCurrentProfile`): caller's own row or `null`.

## Security (P0)

- Every public function: `v.*` validators + `requireUser` as the first
  handler line. All lookups via `by_user` / `by_username` indexes.
- `isPlatformAdmin` is **read-only** here: no arg accepts it, no code path
  writes it (only `convex/seed.ts` sets it). Covered by tests.

## Consume

```ts
import { ProfileSettingsView, useCurrentProfile } from "@/features/profiles";
```

All copy is props-driven via `labels` (defaults: Bahasa Indonesia).

## Note — slice-local tsconfig.json

`slices/profiles/tsconfig.json` overrides `jsx` to `react-jsx` so vitest/Vite
can transform the slice's `.tsx` during tests (root config uses `preserve`,
which esbuild emits as raw JSX — unparseable in the test runtime). Root
`tsc --noEmit` and `next build` ignore nested tsconfigs, so app behavior is
unchanged. Alternative for the integrator: set `esbuild: { jsx: "automatic" }`
in `vitest.config.mts` (shared surface) and delete this file.

## Files

- `convex/features/profiles/` — `username.ts` (pure rules) · `types.ts` ·
  `queries.ts` · `mutations.ts` · tests.
- `slices/profiles/` — components, hooks, config, barrel, metadata pair.
