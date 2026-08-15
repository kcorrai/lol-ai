import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const TIER_COLORS: Record<string, string> = {
  IRON: "#8C8C8C", BRONZE: "#CD7F32", SILVER: "#C0C0C0",
  GOLD: "#FFC24B", PLATINUM: "#00C0A0", EMERALD: "#50C878",
  DIAMOND: "#B9F2FF", MASTER: "#9B59B6", GRANDMASTER: "#E74C3C", CHALLENGER: "#F1C40F",
};

// GET /api/og/summoner?name=Faker%23KR1&region=KR&rank=CHALLENGER+I&wr=63&champ=Leblanc
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") ?? "Summoner";
  const region = searchParams.get("region") ?? "";
  const rank = searchParams.get("rank") ?? "Unranked";
  const wr = searchParams.get("wr") ?? "";
  const champ = searchParams.get("champ") ?? "";
  const tier = searchParams.get("tier") ?? "";

  const tierColor = TIER_COLORS[tier.toUpperCase()] ?? "#A7BCB5";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0C1110 0%, #17201F 100%)",
          padding: 60,
          fontFamily: "sans-serif",
          color: "#E9F5EE",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              background: "#C6FF3D",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#fff",
            }}
          >
            LoL AI Coach
          </div>
          {region && (
            <div style={{ fontSize: 14, color: "#A7BCB5", letterSpacing: 2 }}>
              {region.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
          {name}
        </div>
        <div style={{ fontSize: 28, color: tierColor, marginBottom: 8 }}>
          {rank} {wr ? `· ${wr}% WR` : ""}
        </div>
        {champ && (
          <div style={{ fontSize: 20, color: "#A7BCB5" }}>
            Most played: {champ}
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            fontSize: 16,
            color: "#C6FF3D",
            fontWeight: 600,
          }}
        >
          lolaicoach.com — AI-powered LoL coaching
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
