# tenants slice

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
  sets `status: "active"` and e