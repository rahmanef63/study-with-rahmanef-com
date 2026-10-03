# Study MCP

Study exposes separate Streamable HTTP endpoints:

- User: `https://study-with.rahmanef.com/api/mcp/user`; issue tokens at `/pengaturan/mcp`.
- Admin: `https://study-with.rahmanef.com/api/mcp/admin`; platform admins issue tokens at `/admin/mcp`.

Log in normally, choose a label and 7/30/90-day lifetime, and save the returned token once. The server stores only its SHA256 hash. Tokens belong to the issuing account; admin tokens require its current platform-admin role on every call. User and admin scopes are isolated, including for an administrator who needs both endpoints. Revoke unused tokens from the same page. User account settings list all of your tokens, including former admin tokens, so cleanup remains possible after losing the platform-admin role. Expiry, revocation, membership changes and account deletion take effect on the next call. Twenty stored tokens per account are allowed; revoke expired entries to make space.

Configure a client that supports Streamable HTTP and custom Bearer headers. Example (replace the placeholder locally; never commit credentials):

```json
{
  "mcpServers": {
    "study-user": {
      "url": "https://study-with.rahmanef.com/api/mcp/user",
      "headers": { "Authorization": "Bearer TOKEN_BARU_ANDA" }
    }
  }
}
```

For admin, change the server name, endpoint and token to the corresponding admin scope. This is personal-token authentication, not an OAuth authorization server; a client that supports only OAuth cannot use this configuration unchanged.

After connecting or upgrading the server, refresh/rescan the client's tools/actions. `tools/list` exposes two stable tools with `study/scope` and `study/toolsetSignature` metadata. `capabilities_list({})` supplies scope-specific capability descriptions, schemas, permission requirements and effects. `capability_execute({capability, arguments})` invokes one discovered capability. Do not invent capability names or infer that reading completes a lesson. Obtain the user's direction before writes.

The user scope provides profile, joined communities, published course catalog/overview, accessible lesson and library, course progress, comments, lesson completion, and comment add/delete. The admin scope provides learning analytics, visitor analytics, pending communities, community approval and suspension. These operations delegate to the same guarded application handlers; capability dispatch cannot access arbitrary functions, raw database tables or another account.

Requests are stateless: no server session can preserve revoked permissions. A token has 120/minute and 2,000/day usage units: HTTP authentication uses one unit; capability discovery/execution uses another. Request bodies are bounded at 16 KiB. Invalid/revoked credentials return 401, scope/permission denial 403 and exhausted usage 429. Failures never echo bearer credentials or backend details. No credentials belong in URLs, screenshots, reports, logs, browser persistence or shared client configuration.

## Real-user administration extension (2026-10-03)

The stable MCP tools remain capabilities_list and capability_execute. There are now 19 capabilities: 12 user and 7 admin. New admin.users delegates to the same guarded listUsers handler as the browser (limit1–20, optional cursor/search, search applies within each fetched page; preserve continueCursor/isDone and split metadata). New admin.user_detail accepts a validated userId and delegates to the platform-admin-guarded account detail handler. Identity/email, coarse authenticated activity and learning status are admin-only projections; user scope cannot discover or execute these capabilities. No cleanup/deletion or raw database capability is exposed.

After release reconnect/rescan clients using /api/mcp/admin and read capabilities_list again; its SHA256 toolset signature changes with these descriptors. Public/anonymous traffic remains separate and cannot be linked retrospectively. Unknown historical geography/source remains unknown; authenticated activity retains 30days. Deletion of demo accounts is an internal operator migration, not an MCP capability.
