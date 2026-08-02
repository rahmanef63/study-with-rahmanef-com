# notifications — inbox in-app (#21, wave v1.3)

Per-user notification inbox. Rows are written ONLY by the internal producer
target `features/notifications/notifications:create`, scheduled fire-and-forget
from source features. Producer #1 (this wave): `comments.addComment` reply →
notifies the parent comment's author (never self-replies — P0, tested).

## Mounting (alpha)

```tsx
import { NotificationBell } from "@/features/notifications";

// OS shell header, signed-in users only:
<NotificationBell onNavigate={(href) => openDeepLink(href)} />
```

`onNavigate` is the deep-link seam — without it the component falls back to
`window.location.assign(href)` (the shell's URL-sync resolves it). A standalone
`NotificationInbox` view is also exported.

## Producers (epsilon #22 and beyond)

Schedule the internal mutation — never insert into the table directly:

```ts
await ctx.scheduler.runAfter(0, createNotificationRef, {
  userId: recipientId,      // NEVER the actor (no self-notify, P0)
  tenantId,
  kind: "resource_reviewed",
  title: "…",               // Bahasa Indonesia, no PII beyond displayName
  body: "…",                // optional
  href: "/resources/…",     // optional, RELATIVE path only
});
```

Path contract: `features/notifications/notifications:create` (typed ref:
`convex/features/notifications/refs.ts` — duplicate it into your feature,
convex features have no barrel).

## Security (P0)

Validators + `requireUser` first on every public function; recipients read and
mark ONLY their own rows (`userId` from ctx, `by_user_read` index — foreign ids
answer `NOT_FOUND`); reads bounded; safe projection (no raw docs); `href` must
be a relative path (no open redirect via producers).
