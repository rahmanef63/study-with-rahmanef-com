import { ImageResponse } from "next/og";

// Shared social-card renderer for the per-page opengraph-image routes.
// Literal hex is correct here — this produces a static PNG, not themeable UI.
// Palette mirrors the "Editorial Warmth" base: warm paper #f7f3ea, espresso ink
// #2b2620, terracotta #b3623c (same as app/opengraph-image.tsx).
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function ogCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f3ea",
          backgroundImage:
            "radial-gradient(60% 55% at 88% 12%, rgba(179,98,60,0.20), transparent 70%), radial-gradient(50% 50% at 6% 4%, rgba(179,98,60,0.10), transparent 65%)",
          color: "#2b2620",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#b3623c", fontWeight: 600 }}>
          {eyebrow}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              // Long course titles must not overflow the card; 64px holds ~3
              // lines of Indonesian text at this width.
              fontSize: title.length > 60 ? 54 : 64,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: -1.2,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 30, color: "#6f695f" }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#6f695f" }}>
          belajar·with·rahmanef — study-with.rahmanef.com
        </div>
      </div>
    ),
    OG_SIZE
  );
}
