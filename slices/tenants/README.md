# tenants slice

> **OS pivot (2026-07):** view slice ini sekarang di-mount di dalam **window-app os-shell** via deep-link (mis. `/komunitas/<tenant>`, `/kelas/<tenant>/<course>`, `/profil/<username>`), BUKAN route Next. Path route Next di bawah ini **historis / ilustratif** — skema deep-link ada di AGENTS.md §0 + docs/SLICES.md. Hanya `app/admin/*` yang tetap route asli.

Community profile, join flow, the membership/role data layer, and the community
request + approval flow for the multi-tenant platform (STATUS.md #1 + #6). UI
copy is Bahasa Indonesia, overridable via `labels` props.

## Mount points (integrator)

| Route | Export |
|---|---|
| `/t/[slug]` | `TenantHomeView` (pass `children` to compose the courses etalase below the profile) |
| `/t/[slug]/kelola/komunitas` | `TenantSettingsView` (owner-only; client gate + server authz) |
| `/buka-komunitas` | `RequestTenantForm` (any signed-in user; self-gates on auth) |
| `/admin/komunitas` | `AdminTenantQueueView` (platform-admin; client gate + server authz) |

All views self-fetch via `convex/react`. For preloaded first paint, use the
`tenantsApi` refs with `preloadQuery` at the route level.

## Request → approval flow (#6, v1.1)

- `requestTenant` (any signed-in user): creates a `pending` tenant with the
  caller as `ownerId`. Slug is lowercase-kebab + globally unique (`by_slug`);
  anti-spam caps each user at **one** open pending request (`RATE_LIMITED`).
  Pending tenants stay out of the public etalase (R6).
- `listPending` / `approve` / `reject` (platform admin): the queue. `approve`
  sets `status: "active"` and ensures the requester holds an `owner` membership
  (idempotent); the owner gains no membership in any other tenant.
- **Reject semantic:** `tenants.status` has no `"rejected"` literal in the SSOT
  schema (docs/DATA-MODEL.md), so `reject` sets `status: "suspended"` and keeps
  `requestMessage` intact for context. Suspended reads as `null` publicly (R6).

## Security (P0)

- `tenants.discordWebhookUrl` never appears in ANY query result. Public reads
  project a safe shape; the owner manage view exposes only `hasDiscordWebhook`.
  The form submits the webhook write-only and never receives it back.
- Inactive (pending/suspended) tenants read as `null` publicly (R6).
- Every function: `v.*` validators; member-scoped reads/writes call
  `requireUser` / `requireTenantRole` as the first handler line.

## Out of scope here

Role management UI (R13, v1.1 — the `setMemberRole` mutation + hook already
ship) · course content (courses slice) · route wiring for `/buka-komunitas` and
`/admin/komunitas` (alpha mounts the exported views).
