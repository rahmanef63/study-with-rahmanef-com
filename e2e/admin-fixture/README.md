# Disconnected admin presentation fixture

Run `node scripts/admin-preview.mjs`, open `http://localhost:3013`.

This fixture has no production route, database, Convex transport or real auth
state. Profiles, aggregate counts, browser-session descriptors, video metadata
and token strings are explicitly synthetic local data. It imports the actual
account menu, learning/traffic dashboards, course markdown/media rendering and
MCP setup/table/dialog controls. It proves presentation and interactions only,
never production authorization or OAuth. The source contains no private lesson
body or production identifiers. A public YouTube test iframe/thumbnail can make
external requests; the course metadata hook alone is replaced with a props map.

Views: `?view=menu|learning|traffic|richtext|mcp`. Fixture roles:
`role=admin|member|anonymous|loading`. Dataset states:
`state=complete|partial|empty`; periods `days=7|30|90` (traffic supports7/30).

Next link/navigation/dynamic adapters change fixture history only. The real
admin account destinations map to local fixture views. Synthetic bearer token
`FIXTURE_ONLY_NOT_A_REAL_CREDENTIAL` cannot access an endpoint. CSV and clipboard
writes are the genuine browser operations of the production components. MCP
revoke failure/success changes local React state only. No credentials or browser
storage tokens are created. This server is opt-in and must be stopped after QA.
