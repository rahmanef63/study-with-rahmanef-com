# announcements — pengumuman in-app + Discord webhook (R12)

STATUS row #10 (v1.1). Owns the `announcements` table. Instructor+ post an
announcement; members read the feed; each new post is fanned out to the
community's Discord channel via an internal action.

## Barrel (the contract)

```ts
import {
  AnnouncementsView,      // route body for /t/[slug]/pengumuman
  AnnouncementCard,       // presentational card
  AnnouncementForm,       // create form (instructor+)
  useAnnouncements,       // reactive member list read
  useCreateAnnouncement,  // create mutation hook (toasts on error)
  announcementsApi,       // convex fn refs (preloadQuery/fetchQuery)
  announcementErrorMessage,
  ANNOUNCEMENTS_COPY, mergeAnnouncementsCopy,
} from "@/features/announcements";
```

## Integrator mount (alpha)

`app/` is integrator-only. Mount the view at `/t/[slug]/pengumuman`:

```tsx
// resolve tenantId + membership from the tenants barrel, then:
<AnnouncementsView tenantId={tenant._id} canManage={isInstructorPlus(membership?.role)} />
```

`canManage` shows/hides the create form (UX only). The real guard is the
server-side authz: **list = member**, **create = instructor+**.

## Convex functions

| Function | Visibility | Access |
|---|---|---|
| `queries.list` | public | member of the tenant (`requireTenantRole` member) |
| `mutations.create` | public | instructor+ (`requireTenantRole` instructor) |
| `discord.postToDiscord` | **internal action** | scheduled by `create` |
| `discord.loadForDiscord` | **internal query** | reads announcement + webhook (server-only) |
| `discord.markPostedToDiscord` | **internal mutation** | flips `postedToDiscord=true` |

## Security P0 — the Discord webhook

`tenants.discordWebhookUrl` is a write-only secret. It is read **only inside the
internal action** (`postToDiscord` → `loadForDiscord`), used solely to `fetch`
the Discord API, and is **never** an argument, a public return value, or present
in any read result (`list` returns an explicit safe projection). A fetch error
can embed the URL, so failures log a **static** message — never the raw error.
On any failure the announcement stays saved with `postedToDiscord=false`.

## Notes / deferrals

- **Function refs** use `makeFunctionReference` because regenerating
  `convex/_generated` is integrator-only; the checked-in `api.d.ts` does not yet
  know this feature. Swap to `internal.features.announcements.*` after alpha runs
  `npx convex dev/deploy`. Runtime behaviour is identical.
- **Markdown**: the body renders as plain text with preserved line breaks
  (XSS-safe). Full markdown rendering can adapt the rr `markdown` read surface
  later — evaluated the rr `notifications-center` slice but it is a topbar
  bell/inbox adapter (7 uninstalled shadcn primitives + `npx rr add`), the wrong
  shape for a full-page board, so the list UI is hand-rolled on vendored
  primitives instead.
- **Textarea**: `components/ui-textarea.tsx` is a slice-local twin because
  `components/ui` has no vendored `Textarea` (same pattern as the tenants slice).
