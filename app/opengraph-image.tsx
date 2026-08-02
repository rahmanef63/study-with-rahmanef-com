import { ImageResponse } from "next/og";

// Branded social share card. Literal hex is correct here — this generates a
// static PNG, not themeable UI. Palette mirrors the "Editorial Warmth" base:
// warm paper #f7f3ea, espresso ink #2b2620, terracotta #b3623c.
export const alt = "belajar-with-rahmanef.com — belajar pakai AI, bareng-bareng";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
<path d="M12 1.9 L12.85 3.25 L14.2 4.1 L12.85 4.95 L12 6.3 L11.15 4.95 L9.8 4.1 L11.15 3.25 Z" fill="#f7f3ea"/>
<path d="M12 9.1 C9.1 7.3 5.9 7.1 3.4 8.1 L3.4 17.9 C5.9 16.9 9.1 17.1 12 18.9" stroke="#f7f3ea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 9.1 C14.9 7.3 18.1 7.1 20.6 8.1 L20.6 17.9 C18.1 16.9 14.9 17.1 12 18.9" stroke="#f7f3ea" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 9.1 L12 18.9" stroke="#f7f3ea" stroke-width="1.6" stroke-linecap="round"/></svg>`;

export default function OpengraphImage() {
  const mark = `data:image/svg+xml,${encodeURIComponent(MARK)}`;
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 16,
              background: "#b3623c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={48} height={48} alt="" />
          </div>
          <div style={{ fontSize: 30, color: "#6f695f" }}>belajar·with·rahmanef</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.03, letterSpacing: -1.5 }}>
            Belajar pakai AI, bareng-bareng.
          </div>
          <div style={{ fontSize: 32, color: "#6f695f" }}>
            Kelas praktis pengaplikasian AI — gratis, berbahasa Indonesia.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#b3623c", fontWeight: 600 }}>
          study-with.rahmanef.com
        </div>
      </div>
    ),
    size,
  );
}
