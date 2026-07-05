# tenants slice

Community profile, join flow, and the membership/role data layer for the
multi-tenant platform (STATUS.md #1, v1 scope). UI copy is Bahasa Indonesia,
overridable via `labels` props.

## Mount points (integrator)

| Route | Export |
|---|---|
| `/t/[slug]` | `TenantHomeView` (pass `children` to compose the courses etalase below the profile) |
| `/t/[slug]/kelola/komunitas` | `TenantSettingsView` (owner-only; client gate + server authz) |

Both views self-fetch via `convex/react`. For preloaded first paint, use the
`tenantsApi` refs with `preloadQuery` at the route level.

## Security (P0)

- `tenants.discordWebhookUrl` never appears in ANY query result. Public reads
  project a safe shape; the owner manage view exposes only `hasDiscordWebhook`.
  The form submits the webhook write-only and never receives it back.
- Inactive (pending/suspended) tenants read as `null` publicly (R6).
- Every function: `v.*` validators; member-scoped reads/writes call
  `requireUser` / `requireTenantRole` as the first handler line.

## Out of scope here

Request form + `/admin` approval queue (row #6, v1.1) · role management UI
(R13, v1.1 — the `setMemberRole` mutation + hook already ship) · course
content (courses slice).
