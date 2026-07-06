# resources slice (STATUS #7, v1.1)

Resource board (R8) + suggestion box (R9) for a tenant. Members submit; instructors curate.

## Mount (integrator / alpha)

```tsx
import { ResourceBoardView, SuggestionBoxView } from "@/features/resources";

// /t/[slug]/resources
<ResourceBoardView tenantId={tenantId} canModerate={viewerRole === "instructor" || viewerRole === "owner"} />

// /t/[slug]/usulan
<SuggestionBoxView tenantId={tenantId} canModerate={viewerRole === "instructor" || viewerRole === "owner"} />
```

`canModerate` is **UX only** — it toggles the pending-review tab / triage controls. Every
Convex function re-checks the role server-side (`requireTenantRole`), so a member who forces
`canModerate` still gets `NOT_AUTHORIZED`. `copy` overrides Bahasa strings per consumer.

## Convex surface (`api.features.resources.*`)

| Function | Role | Notes |
|---|---|---|
| `resources:submit` | member | url http(s) validated; lands `pending` |
| `resources:curate` | instructor+ | `{ decision: approved \| rejected }`, records `reviewedBy` |
| `suggestions:submit` | member | lands `open` |
| `suggestions:setStatus` | instructor+ | open → planned/done/rejected |
| `queries:listApprovedResources` | member | approved only |
| `queries:listPendingResources` | instructor+ | review queue |
| `queries:listMineResources` | member | caller's own (any status) |
| `queries:listOpenSuggestions` | member | open only |
| `queries:listMineSuggestions` | member | caller's own (any status) |

## Security invariants (P0)

- Pending resources are visible only to instructor+ (`listPendingResources`) and the submitter
  (`listMineResources`) — **enforced in the query**, never via the UI alone. A plain member
  cannot see another member's pending item through any function.
- `v.*` validators + authz helper on the first line of every function; auth runs **before** any
  by-ID read (see `access.ts`; regression covered in `authz-order.test.ts`).
- Anti-spam: ≤5 pending/open items per user per tenant → `RATE_LIMITED`. Counted via the
  `by_tenant_status` index + bounded `.take()` (the DATA-MODEL simple guard — **not** the rr
  `rate-limit` dependency).

## Tests

`npx vitest run convex/features/resources slices/resources` — 29 specs (denied paths, rate-limit,
submitter-sees-own-pending, member-cannot-see-others-pending, authz-order, barrel + metadata sync).
