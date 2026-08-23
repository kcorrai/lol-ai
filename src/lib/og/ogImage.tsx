import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgOptions {
  title: string;
  subtitle: string;
  badge?: string;
}

// Shared branded Open Graph card (dark hextech theme, gold accent). Text-only so
// it renders reliably without fetching remote images.
export function renderOgImage({ title, subtitle, badge }: OgOptions): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #080B0A 0%, #111817 100%)",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{ width: "18px", height: "18px", borderRadius: "4px", background: "#C6FF3D" }}
        />
        <div style={{ fontSize: "30px", fontWeight: 700, color: "#E9F5EE" }}>LoL AI Coach</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {badge ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: "999px",
              border: "1px solid rgba(198,255,61,0.5)",
              color: "#C6FF3D",
              fontSize: "26px",
              fontWeight: 600,
            }}
          >
            {badge}
          </div>
        ) : null}
        <div style={{ fontSize: "84px", fontWeight: 800, color: "#E9F5EE", lineHeight: 1.05 }}>
          {title}
        </div>
        <div style={{ fontSize: "34px", color: "#A7BCB5", maxWidth: "900px" }}>{subtitle}</div>
      </div>

      <div style={{ fontSize: "24px", color: "#6C817B" }}>
        Free · Updated every patch · No login
      </div>
    </div>,
    { ...OG_SIZE }
  );
}
