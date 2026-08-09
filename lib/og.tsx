import { ImageResponse } from "next/og";

// Shared social-card renderer for the per-page opengraph-image routes.
// Literal hex is correct here — this produces a static PNG, not themeable UI.
// Palette mirrors the arcade cabinet base: CRT black #12141f, coin gold
// #ffc933, phosphor cyan #4fd8e8, muted #8b93b0.
//
// Deliberately NOT loading Press Start 2P: next/og needs the font as bytes, so
// using it would mean an extra network fetch on every card render (and a
// failure mode on a cold container) for a face that is unreadable at card
// title sizes anyway. The pixel language is carried by the frame, the grid and
// the palette instead.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BLACK = "#12141f";
const GOLD = "#ffc933";
const CYAN = "#4fd8e8";
const MUTED = "#8b93b0";

/** A row of chunky squares — the "life counter" strip along the bottom. */
function pips(n: number, color: string) {
  return Array.from({ length: n }, (_, i) => (
    <div key={i} style={{ width: 16, height: 16, background: color }} />
  ));
}

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
          background: BLACK,
          // Pixel grid, drawn with two repeating gradients so there is no image
          // asset to ship or fetch.
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,201,51,0.055) 0 1px, transparent 1px 40px), repeating-linear-gradient(to bottom, rgba(255,201,51,0.055) 0 1px, transparent 1px 40px)",
          padding: 40,
        }}
      >
        {/* Hard cabinet frame — no radius, no blur. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            border: `6px solid ${GOLD}`,
            padding: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: CYAN,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                fontSize: title.length > 60 ? 52 : 62,
                fontWeight: 700,
                lineHeight: 1.14,
                letterSpacing: -0.5,
                color: GOLD,
                // Hard offset, the pixel-shadow language of the UI.
                textShadow: `4px 4px 0 ${BLACK}`,
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div style={{ display: "flex", fontSize: 30, color: "#e6e9f5" }}>{subtitle}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 6 }}>{pips(3, GOLD)}</div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED, letterSpacing: 2 }}>
              STUDY-WITH.RAHMANEF.COM
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
