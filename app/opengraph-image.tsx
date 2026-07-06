import { ImageResponse } from "next/og";

// Branded social share card (UI-UX-PRD §5.6 / §6 OG). Colors mirror the
// "nature" preset (cream + deep green) — literal values are correct here: this
// generates a PNG asset, not themeable UI.
export const alt = "belajar-with-rahmanef.com — belajar pakai AI, bareng-bareng";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f1e6",
          color: "#3d3a2e",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 16,
              background: "#516b34",
              color: "#f7f5ec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
              fontWeight: 700,
            }}
          >
            b
          </div>
          <div style={{ fontSize: 30, color: "#6f6b58" }}>belajar-with-rahmanef.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 70, fontWeight: 700, lineHeight: 1.05 }}>
            Belajar pakai AI, bareng-bareng.
          </div>
          <div style={{ fontSize: 32, color: "#6f6b58" }}>
            Kelas praktis pengaplikasian AI — gratis, berbahasa Indonesia.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#516b34", fontWeight: 600 }}>
          study-with.rahmanef.com
        </div>
      </div>
    ),
    size
  );
}
