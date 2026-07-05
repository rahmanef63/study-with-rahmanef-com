# marketing-chrome

Config-driven marketing site **header + footer** — the chrome every template
hand-rolls. Pure UI, prop-only, no Convex. Two components, composable from any
marketing page.

## Surface

| Component | Props | Notes |
|---|---|---|
| `MarketingHeader` | `brand, nav, cta?, secondaryCta?, layout?, sticky?, className?` | Desktop nav + Sheet mobile menu. Three layouts. |
| `MarketingFooter` | `brand, columns?, social?, legal?, copyright?, layout?, className?` | Multi-column or slim row. Lucide social icons. |

### Shared shapes

```ts
type Brand = { name: string; href?: string; logo?: React.ReactNode };
type NavLink = { label: string; href: string; external?: boolean };
type Cta = { label: string; href: string };
type FooterColumn = { heading: string; links: { label: string; href: string }[] };
type SocialLink = { kind: "github" | "x" | "linkedin" | "youtube" | "instagram"; href: string };
```

### Header layouts

- `split` (default) — brand left · nav centered · CTAs right
- `centered` — brand stacked above centered nav, CTAs to the right
- `minimal` — brand + CTAs only, no inline nav

`sticky` pins the bar to the top (`sticky top-0 z-40`). Mobile always collapses
into a `Sheet` triggered by a `Button` with the `Menu` icon.

### Footer layouts

- `columns` (default) — brand blurb + link grid + legal bar (with `Separator`)
- `slim` — single row: brand · legal links · social

## Usage

```tsx
import { MarketingHeader, MarketingFooter } from "@/features/marketing-chrome";

<MarketingHeader
  brand={{ name: "Acme", href: "/" }}
  nav={[
    { label: "Product", href: "/product" },
    { label: "Docs", href: "https://docs.acme.com", external: true },
  ]}
  cta={{ label: "Get started", href: "/signup" }}
  secondaryCta={{ label: "Sign in", href: "/login" }}
  layout="split"
  sticky
/>

<MarketingFooter
  brand={{ name: "Acme" }}
  columns={[
    { heading: "Product", links: [{ label: "Features", href: "/features" }] },
  ]}
  social={[{ kind: "github", href: "https://github.com/acme" }]}
  legal={[{ label: "Privacy", href: "/privacy" }]}
  copyright="© 2026 Acme, Inc."
  layout="columns"
/>
```

## Convex tables

None — pure component slice.

## Permissions

None.

## Dependencies

- npm: `lucide-react` (Menu + social icons — neutral lucide stand-ins; swap for
  a brand-icon set like `simple-icons` post-copy if you want true brand glyphs)
- shadcn primitives: `button`, `sheet`, `separator`
- env vars: none

## Notes

- All copy + hrefs are consumer-supplied. The slice ships no English strings
  beyond aria labels.
- Links render as plain `<a>` so consumers can pass any href (internal or
  external). Swap to `next/link` post-copy if you want client routing.
- Uses neutral shadcn tokens (`bg-background`, `text-muted-foreground`,
  `border`) — works with any theme preset.
