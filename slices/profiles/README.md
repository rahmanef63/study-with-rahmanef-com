# profiles — Profil Pengguna + Halaman Publik

Slice for STATUS rows **#4** (own-profile, v1) and **#9** (public page + badge
wall, v1.1). Agent: delta.

## What it does

- **Ensure-on-first-login** (`ensureProfile`): idempotent; derives a globally
  unique lowercase-kebab-case username from the Google account (name → email
  local part), auto-suffixes `-2`, `-3`, … on collision so sign-in never fails.
- **Settings form** (`ProfileSettingsView` → mount at `/pengaturan/profil`):
  username, displayName, bio, avatarUrl. Explicit username rename to a taken
  name rejects `VALIDATION_FAILED`. Availability probe on blur.
- **Current-profile query** (`getCurrentProfile`): caller's own row or `null`.
- **Public profile page** (`PublicProfileView` → mount at `/u/[username]`):
  avatar, displayName, `@username`, bio, a share/ID copy button, and the
  **badge wall** — one badge per completed course.

## Public profile — anonymous etalase (#9)

Two queries in `convex/features/profiles/public.ts` are the slice's **only**
anonymous surface (AGENTS.md §6 — `public*` names + `ANONYMOUS ETALASE
WHITELIST` header):

- `publicGetByUsername({ username })` → **safe projection only**:
  `{ username, displayName, bio, avatarUrl }`. Never `userId`,
  `isPlatformAdmin`, or `_id`. Unknown handle → `NOT_FOUND`.
- `publicListBadges({ username })` → badges from `courseCompletions` (`by_user`)
  joined to their course + tenant. Only **published** courses of **active**
  tenants surface (drafts never leak — P0 §6); newest first. Shape:
  `{ courseTitle, courseSlug, tenantSlug, earnedAt }`.

Reading the shared `courseCompletions` / `courses` / `tenants` tables is
sanctioned table access (precedent: the progress feature; not a code import).

## Security (P0)

- Every **authed** function: `v.*` validators + `requireUser` as the first
  handler line. All lookups via `by_user` / `by_username` indexes.
- The two `public*` queries skip auth **by design** (etalase §6): validators
  present, active/published rows only, explicit safe projection, bounded
  `.take()` — no bare `.collect()`. Projection shape asserted in tests.
- `isPlatformAdmin` is **read-only** here: no arg accepts it, no code path
  writes it (only `convex/seed.ts` sets it). Covered by tests.

## Integration point for alpha — mount `/u/[username]`

`PublicProfileView` is a client component that fetches its own data (anonymous,
works signed-out). Minimal mount:

```tsx
// app/u/[username]/page.tsx  (integrator/app-level — NOT in this slice)
import { PublicProfileView } from "@/features/profiles";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  // Pass an absolute shareUrl so the copy button shares a link (slice never
  // hardcodes an origin); omit it to copy "@username" instead.
  return <PublicProfileView username={username} shareUrl={`https://study-with.rahmanef.com/u/${username}`} />;
}
```

Optional SSR/first-paint: fetch on the server and render `PublicProfileCard`
directly (skips the loading skeleton, enables profile metadata/OG tags). The
queries throw `NOT_FOUND` for unknown handles — the slice's own boundary renders
a friendly fallback, or the app route can supply `not-found.tsx`.

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
  `queries.ts` · `mutations.ts` · **`public.ts`** (anonymous etalase) ·
  tests (`profiles.test.ts`, `username.test.ts`, **`public.test.ts`**).
- `slices/profiles/` — components (settings + **public-profile-view /
  public-profile-card / badge-wall / profile-avatar / public-profile-boundary**),
  hooks (**`use-public-profile`**), config (**`public-labels`**), barrel,
  metadata pair.
