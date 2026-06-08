import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
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

  const tierColor = TIER_COLORS[tier.toUpperCase()] ?? "#a5b4fc";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0f0f14 0%, #1a1a2e 100%)",
          padding: 60,
          fontFamily: "sans-serif",
          color: "#e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              background: "#6366f1",
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
            <div style={{ fontSize: 14, color: "#94a3b8", letterSpacing: 2 }}>
              {region.toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
          {name}
        </div>
        <div style={{ fontSize: 28, color: tierColor, marginBottom: 8 }}>
          {rank} {wr ? `· %${wr} WR` : ""}
        </div>
        {champ && (
          <div style={{ fontSize: 20, color: "#94a3b8" }}>
            En çok oynanan: {champ}
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            fontSize: 16,
            color: "#6366f1",
            fontWeight: 600,
          }}
        >
          lolaicoach.com — AI destekli LoL koçluğu
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
