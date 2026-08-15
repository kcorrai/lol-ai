import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPublicProfile } from "@/domains/identity/services/profileService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

export const runtime = "nodejs";

// GET /api/og/profile/[slug] — OG image for public profile pages
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
): Promise<Response> {
  const rl = await checkRateLimit(`og-profile:${getIp(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const profile = await getPublicProfile(params.slug);

  const name = profile?.displayName ?? params.slug;
  const rankStr = profile?.rank
    ? `${profile.rank.tier} ${profile.rank.division} · ${profile.rank.lp} LP`
    : "Unranked";
  const wr = profile?.winRate !== null && profile?.winRate !== undefined
    ? `${profile.winRate}% WR`
    : "";
  const topChamp = profile?.topChampions[0]?.name ?? "";
  const badgeCount = profile?.badges.length ?? 0;

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
        </div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
          {name}
        </div>
        <div style={{ fontSize: 28, color: "#A7BCB5", marginBottom: 8 }}>
          {rankStr} {wr ? `· ${wr}` : ""}
        </div>
        {topChamp && (
          <div style={{ fontSize: 20, color: "#A7BCB5", marginBottom: 8 }}>
            En iyi: {topChamp}
          </div>
        )}
        {badgeCount > 0 && (
          <div style={{ fontSize: 18, color: "#A7BCB5" }}>
            {badgeCount} badges earned
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
